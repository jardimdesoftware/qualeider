import { Test, TestingModule } from '@nestjs/testing';
import { InvitesService } from '@/application/services/invites/invites.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { InviteStatus, InviteAction } from '@/domain/enums/enums';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { IInviteRepository } from '@/domain/repositories/invite.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IAssociationRepository } from '@/domain/repositories/association.repository';

describe('InvitesService', () => {
  let service: InvitesService;
  let inviteRepository: jest.Mocked<IInviteRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let associationRepository: jest.Mocked<IAssociationRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesService,
        {
          provide: IInviteRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByToken: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            expireOldInvites: jest.fn(),
          },
        },
        {
          provide: IUserRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: IAssociationRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvitesService>(InvitesService);
    inviteRepository = module.get(IInviteRepository);
    userRepository = module.get(IUserRepository);
    associationRepository = module.get(IAssociationRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvite', () => {
    it('deve criar um convite com sucesso', async () => {
      const associationId = 1;
      const createDto: CreateInviteDto = {
        userId: 2,
        message: 'Join our association',
      };

      const mockAssociation = {
        id: 1,
        name: 'Test Association',
      };

      const mockUser = {
        id: 2,
        name: 'John Doe',
        email: 'john@example.com',
        associationId: null,
      };

      const mockInvite = {
        id: 1,
        token: 'test-token-123',
        associationId: 1,
        userId: 2,
        message: 'Join our association',
        expiresAt: new Date(),
        status: InviteStatus.PENDING,
        user: mockUser,
        association: mockAssociation,
      };

      associationRepository.findById.mockResolvedValue(mockAssociation as any);
      userRepository.findById.mockResolvedValue(mockUser as any);
      inviteRepository.findAll.mockResolvedValue([]);
      inviteRepository.create.mockResolvedValue(mockInvite as any);

      const result = await service.createInvite(associationId, createDto);

      expect(result).toHaveProperty('token', 'test-token-123');
      expect(result.message).toBe('Convite enviado com sucesso');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.created',
        expect.any(Object),
      );
    });

    it('deve lançar EntityNotFoundException quando associação não for encontrada', async () => {
      const createDto: CreateInviteDto = {
        userId: 2,
        message: 'Test',
      };

      associationRepository.findById.mockResolvedValue(null);

      await expect(service.createInvite(999, createDto)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.createInvite(999, createDto)).rejects.toThrow(
        'Associação não encontrada',
      );
    });

    it('deve lançar EntityNotFoundException quando usuário não for encontrado', async () => {
      const createDto: CreateInviteDto = {
        userId: 999,
        message: 'Test',
      };

      associationRepository.findById.mockResolvedValue({
        id: 1,
        name: 'Test Association',
      } as any);
      userRepository.findById.mockResolvedValue(null);

      await expect(service.createInvite(1, createDto)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.createInvite(1, createDto)).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('deve lançar BusinessException quando usuário já pertence à associação', async () => {
      const createDto: CreateInviteDto = {
        userId: 2,
        message: 'Test',
      };

      associationRepository.findById.mockResolvedValue({
        id: 1,
        name: 'Test',
      } as any);
      userRepository.findById.mockResolvedValue({
        id: 2,
        associationId: 1,
      } as any);

      await expect(service.createInvite(1, createDto)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.createInvite(1, createDto)).rejects.toThrow(
        'Usuário já está vinculado a esta associação',
      );
    });

    it('deve lançar BusinessException quando já existe convite pendente', async () => {
      const createDto: CreateInviteDto = {
        userId: 2,
        message: 'Test',
      };

      associationRepository.findById.mockResolvedValue({
        id: 1,
        name: 'Test',
      } as any);
      userRepository.findById.mockResolvedValue({
        id: 2,
        associationId: null,
      } as any);
      inviteRepository.findAll.mockResolvedValue([
        {
          id: 1,
          status: InviteStatus.PENDING,
        } as any,
      ]);

      await expect(service.createInvite(1, createDto)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.createInvite(1, createDto)).rejects.toThrow(
        'Já existe um convite pendente para este usuário',
      );
    });
  });

  describe('respondToInvite', () => {
    it('deve aceitar convite com sucesso', async () => {
      const token = 'valid-token';
      const mockInvite = {
        id: 1,
        token,
        userId: 2,
        associationId: 1,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 2, name: 'John Doe' },
        association: { id: 1, name: 'Test Association' },
      };

      inviteRepository.findByToken.mockResolvedValue(mockInvite as any);
      inviteRepository.update.mockResolvedValue(mockInvite as any);
      userRepository.update.mockResolvedValue({} as any);

      const result = await service.respondToInvite(token, InviteAction.ACCEPT);

      expect(result.message).toContain('Você agora faz parte da');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.accepted',
        expect.any(Object),
      );
      expect(userRepository.update).toHaveBeenCalledWith(2, {
        associationId: 1,
      });
    });

    it('deve recusar convite com sucesso', async () => {
      const token = 'valid-token';
      const mockInvite = {
        id: 1,
        token,
        userId: 2,
        associationId: 1,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 2, name: 'John Doe' },
        association: { id: 1, name: 'Test Association' },
      };

      inviteRepository.findByToken.mockResolvedValue(mockInvite as any);
      inviteRepository.update.mockResolvedValue(mockInvite as any);

      const result = await service.respondToInvite(token, InviteAction.DECLINE);

      expect(result.message).toBe('Convite recusado');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.declined',
        expect.any(Object),
      );
    });

    it('deve lançar EntityNotFoundException quando convite não for encontrado', async () => {
      inviteRepository.findByToken.mockResolvedValue(null);

      await expect(
        service.respondToInvite('invalid-token', InviteAction.ACCEPT),
      ).rejects.toThrow(EntityNotFoundException);
      await expect(
        service.respondToInvite('invalid-token', InviteAction.ACCEPT),
      ).rejects.toThrow('Convite não encontrado');
    });

    it('deve lançar BusinessException quando convite já foi respondido', async () => {
      const mockInvite = {
        id: 1,
        status: InviteStatus.ACCEPTED,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 2, name: 'John Doe' },
        association: { id: 1, name: 'Test Association' },
      };

      inviteRepository.findByToken.mockResolvedValue(mockInvite as any);

      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow(BusinessException);
      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow('Convite já foi accepted');
    });

    it('deve lançar BusinessException e marcar como expirado quando convite estiver expirado', async () => {
      const mockInvite = {
        id: 1,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() - 86400000),
        user: { id: 2, name: 'John Doe' },
        association: { id: 1, name: 'Test Association' },
      };

      inviteRepository.findByToken.mockResolvedValue(mockInvite as any);
      inviteRepository.update.mockResolvedValue(mockInvite as any);

      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow(BusinessException);
      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow('Convite expirado');

      expect(inviteRepository.update).toHaveBeenCalledWith(1, {
        status: InviteStatus.EXPIRED,
      });
    });
  });

  describe('cancelInvite', () => {
    it('deve cancelar convite com sucesso', async () => {
      const mockInvite = {
        id: 1,
        associationId: 1,
        status: InviteStatus.PENDING,
      };

      inviteRepository.findById.mockResolvedValue(mockInvite as any);
      inviteRepository.update.mockResolvedValue(mockInvite as any);

      const result = await service.cancelInvite(1, 1);

      expect(result.message).toBe('Convite cancelado com sucesso');
      expect(inviteRepository.update).toHaveBeenCalledWith(1, {
        status: InviteStatus.CANCELED,
        respondedAt: expect.any(Date),
      });
    });

    it('deve lançar EntityNotFoundException quando convite não for encontrado', async () => {
      inviteRepository.findById.mockResolvedValue(null);

      await expect(service.cancelInvite(1, 999)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.cancelInvite(1, 999)).rejects.toThrow(
        'Convite não encontrado ou já foi respondido',
      );
    });
  });

  describe('getInviteByToken', () => {
    it('deve retornar detalhes do convite com flag de expirado', async () => {
      const mockInvite = {
        id: 1,
        status: InviteStatus.PENDING,
        message: 'Join us',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        association: { id: 1, name: 'Test' },
        user: { id: 2, name: 'John' },
      };

      inviteRepository.findByToken.mockResolvedValue(mockInvite as any);

      const result = await service.getInviteByToken('valid-token');

      expect(result).toHaveProperty('isExpired', false);
      expect(result.association.name).toBe('Test');
    });

    it('deve lançar EntityNotFoundException quando convite não for encontrado', async () => {
      inviteRepository.findByToken.mockResolvedValue(null);

      await expect(service.getInviteByToken('invalid-token')).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.getInviteByToken('invalid-token')).rejects.toThrow(
        'Convite não encontrado',
      );
    });
  });
  describe('getUserPendingInvites', () => {
    it('deve retornar convites pendentes para o usuário', async () => {
      const userId = 2;
      const mockInvites = [
        {
          id: 1,
          userId: 2,
          status: InviteStatus.PENDING,
          expiresAt: new Date(Date.now() + 86400000),
          sentAt: new Date(),
          association: {
            id: 1,
            name: 'Association A',
            city: 'São Paulo',
            state: 'SP',
            coverageArea: 'Metropolitan',
          },
        },
        {
          id: 2,
          userId: 2,
          status: InviteStatus.PENDING,
          expiresAt: new Date(Date.now() + 172800000),
          sentAt: new Date(),
          association: {
            id: 2,
            name: 'Association B',
            city: 'Rio de Janeiro',
            state: 'RJ',
            coverageArea: 'Downtown',
          },
        },
      ];

      inviteRepository.findAll.mockResolvedValue(mockInvites as any);

      const result = await service.getUserPendingInvites(userId);

      expect(inviteRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2,
          status: InviteStatus.PENDING,
          expiresAfter: expect.any(Date),
        }),
        { includeAssociation: true },
      );
      expect(result).toHaveLength(2);
      expect(result[0].association.name).toBe('Association A');
    });

    it('deve retornar array vazio quando usuário não tiver convites pendentes', async () => {
      inviteRepository.findAll.mockResolvedValue([]);

      const result = await service.getUserPendingInvites(999);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getAssociationInvites', () => {
    it('deve retornar todos os convites da associação quando status não for informado', async () => {
      const associationId = 1;
      const mockInvites = [
        {
          id: 1,
          associationId: 1,
          status: InviteStatus.PENDING,
          sentAt: new Date(),
          user: {
            id: 2,
            name: 'John Doe',
            email: 'john@example.com',
            city: 'São Paulo',
            state: 'SP',
          },
        },
        {
          id: 2,
          associationId: 1,
          status: InviteStatus.ACCEPTED,
          sentAt: new Date(),
          user: {
            id: 3,
            name: 'Jane Doe',
            email: 'jane@example.com',
            city: 'Rio de Janeiro',
            state: 'RJ',
          },
        },
      ];

      inviteRepository.findAll.mockResolvedValue(mockInvites as any);

      const result = await service.getAssociationInvites(associationId);

      expect(inviteRepository.findAll).toHaveBeenCalledWith(
        {
          associationId: 1,
          status: undefined,
        },
        { includeUser: true },
      );
      expect(result).toHaveLength(2);
      expect(result[0].user.name).toBe('John Doe');
    });

    it('deve filtrar convites por status quando informado', async () => {
      const associationId = 1;
      const mockInvites = [
        {
          id: 1,
          associationId: 1,
          status: InviteStatus.PENDING,
          sentAt: new Date(),
          user: {
            id: 2,
            name: 'John Doe',
            email: 'john@example.com',
            city: 'São Paulo',
            state: 'SP',
          },
        },
      ];

      inviteRepository.findAll.mockResolvedValue(mockInvites as any);

      const result = await service.getAssociationInvites(
        associationId,
        InviteStatus.PENDING,
      );

      expect(inviteRepository.findAll).toHaveBeenCalledWith(
        {
          associationId: 1,
          status: InviteStatus.PENDING,
        },
        { includeUser: true },
      );
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(InviteStatus.PENDING);
    });

    it('deve retornar array vazio quando associação não tiver convites', async () => {
      inviteRepository.findAll.mockResolvedValue([]);

      const result = await service.getAssociationInvites(999);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});

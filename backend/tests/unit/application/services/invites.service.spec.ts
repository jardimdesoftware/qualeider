import { Test, TestingModule } from '@nestjs/testing';
import { InvitesService } from '@/application/services/invites/invites.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { InviteStatus, InviteAction } from '@/domain/enums/enums';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

describe('InvitesService', () => {
  let service: InvitesService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesService,
        {
          provide: PrismaService,
          useValue: prismaService,
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
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvite', () => {
    it('should create invite successfully', async () => {
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

      prismaService.association.findUnique.mockResolvedValue(
        mockAssociation as any,
      );
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.invite.findFirst.mockResolvedValue(null);
      prismaService.invite.create.mockResolvedValue(mockInvite as any);

      const result = await service.createInvite(associationId, createDto);

      expect(result).toHaveProperty('token', 'test-token-123');
      expect(result.message).toBe('Convite enviado com sucesso');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.created',
        expect.any(Object),
      );
    });

    it('should throw EntityNotFoundException when association not found', async () => {
      const createDto: CreateInviteDto = {
        userId: 2,
        message: 'Test',
      };

      prismaService.association.findUnique.mockResolvedValue(null);

      await expect(service.createInvite(999, createDto)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.createInvite(999, createDto)).rejects.toThrow(
        'Associação não encontrada',
      );
    });

    it('should throw EntityNotFoundException when user not found', async () => {
      const createDto: CreateInviteDto = {
        userId: 999,
        message: 'Test',
      };

      prismaService.association.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Association',
      } as any);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createInvite(1, createDto)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.createInvite(1, createDto)).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('should throw BusinessException when user already belongs to association', async () => {
      const createDto: CreateInviteDto = {
        userId: 2,
        message: 'Test',
      };

      prismaService.association.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test',
      } as any);
      prismaService.user.findUnique.mockResolvedValue({
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

    it('should throw BusinessException when pending invite already exists', async () => {
      const createDto: CreateInviteDto = {
        userId: 2,
        message: 'Test',
      };

      prismaService.association.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test',
      } as any);
      prismaService.user.findUnique.mockResolvedValue({
        id: 2,
        associationId: null,
      } as any);
      prismaService.invite.findFirst.mockResolvedValue({
        id: 1,
        status: InviteStatus.PENDING,
      } as any);

      await expect(service.createInvite(1, createDto)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.createInvite(1, createDto)).rejects.toThrow(
        'Já existe um convite pendente para este usuário',
      );
    });
  });

  describe('respondToInvite', () => {
    it('should accept invite successfully', async () => {
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

      prismaService.invite.findUnique.mockResolvedValue(mockInvite as any);
      prismaService.$transaction.mockResolvedValue([{}, {}] as any);

      const result = await service.respondToInvite(token, InviteAction.ACCEPT);

      expect(result.message).toContain('Você agora faz parte da');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.accepted',
        expect.any(Object),
      );
    });

    it('should decline invite successfully', async () => {
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

      prismaService.invite.findUnique.mockResolvedValue(mockInvite as any);
      prismaService.invite.update.mockResolvedValue(mockInvite as any);

      const result = await service.respondToInvite(token, InviteAction.DECLINE);

      expect(result.message).toBe('Convite recusado');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.declined',
        expect.any(Object),
      );
    });

    it('should throw EntityNotFoundException when invite not found', async () => {
      prismaService.invite.findUnique.mockResolvedValue(null);

      await expect(
        service.respondToInvite('invalid-token', InviteAction.ACCEPT),
      ).rejects.toThrow(EntityNotFoundException);
      await expect(
        service.respondToInvite('invalid-token', InviteAction.ACCEPT),
      ).rejects.toThrow('Convite não encontrado');
    });

    it('should throw BusinessException when invite already responded', async () => {
      const mockInvite = {
        id: 1,
        status: InviteStatus.ACCEPTED,
        expiresAt: new Date(Date.now() + 86400000),
      };

      prismaService.invite.findUnique.mockResolvedValue(mockInvite as any);

      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow(BusinessException);
      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow('Convite já foi accepted');
    });

    it('should throw BusinessException and mark as expired when invite is expired', async () => {
      const mockInvite = {
        id: 1,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() - 86400000),
      };

      prismaService.invite.findUnique.mockResolvedValue(mockInvite as any);
      prismaService.invite.update.mockResolvedValue(mockInvite as any);

      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow(BusinessException);
      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow('Convite expirado');

      expect(prismaService.invite.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: InviteStatus.EXPIRED },
      });
    });
  });

  describe('cancelInvite', () => {
    it('should cancel invite successfully', async () => {
      const mockInvite = {
        id: 1,
        associationId: 1,
        status: InviteStatus.PENDING,
      };

      prismaService.invite.findFirst.mockResolvedValue(mockInvite as any);
      prismaService.invite.update.mockResolvedValue(mockInvite as any);

      const result = await service.cancelInvite(1, 1);

      expect(result.message).toBe('Convite cancelado com sucesso');
      expect(prismaService.invite.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: InviteStatus.CANCELED,
          respondedAt: expect.any(Date),
        },
      });
    });

    it('should throw EntityNotFoundException when invite not found', async () => {
      prismaService.invite.findFirst.mockResolvedValue(null);

      await expect(service.cancelInvite(1, 999)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.cancelInvite(1, 999)).rejects.toThrow(
        'Convite não encontrado ou já foi respondido',
      );
    });
  });

  describe('getInviteByToken', () => {
    it('should return invite details with expired flag', async () => {
      const mockInvite = {
        id: 1,
        status: InviteStatus.PENDING,
        message: 'Join us',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        association: { id: 1, name: 'Test' },
        user: { id: 2, name: 'John' },
      };

      prismaService.invite.findUnique.mockResolvedValue(mockInvite as any);

      const result = await service.getInviteByToken('valid-token');

      expect(result).toHaveProperty('isExpired', false);
      expect(result.association.name).toBe('Test');
    });

    it('should throw EntityNotFoundException when invite not found', async () => {
      prismaService.invite.findUnique.mockResolvedValue(null);

      await expect(service.getInviteByToken('invalid-token')).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.getInviteByToken('invalid-token')).rejects.toThrow(
        'Convite não encontrado',
      );
    });
  });
  describe('getUserPendingInvites', () => {
    it('should return pending invites for user', async () => {
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

      prismaService.invite.findMany.mockResolvedValue(mockInvites as any);

      const result = await service.getUserPendingInvites(userId);

      expect(prismaService.invite.findMany).toHaveBeenCalledWith({
        where: {
          userId: 2,
          status: InviteStatus.PENDING,
          expiresAt: { gte: expect.any(Date) },
        },
        include: {
          association: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              coverageArea: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].association.name).toBe('Association A');
    });

    it('should return empty array when user has no pending invites', async () => {
      prismaService.invite.findMany.mockResolvedValue([]);

      const result = await service.getUserPendingInvites(999);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should filter out expired invites', async () => {
      const userId = 2;

      prismaService.invite.findMany.mockResolvedValue([]);

      const result = await service.getUserPendingInvites(userId);

      expect(prismaService.invite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: { gte: expect.any(Date) },
          }),
        }),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe('getAssociationInvites', () => {
    it('should return all invites for association when status not provided', async () => {
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

      prismaService.invite.findMany.mockResolvedValue(mockInvites as any);

      const result = await service.getAssociationInvites(associationId);

      expect(prismaService.invite.findMany).toHaveBeenCalledWith({
        where: {
          associationId: 1,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              city: true,
              state: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].user.name).toBe('John Doe');
    });

    it('should filter invites by status when provided', async () => {
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

      prismaService.invite.findMany.mockResolvedValue(mockInvites as any);

      const result = await service.getAssociationInvites(
        associationId,
        InviteStatus.PENDING,
      );

      expect(prismaService.invite.findMany).toHaveBeenCalledWith({
        where: {
          associationId: 1,
          status: InviteStatus.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              city: true,
              state: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(InviteStatus.PENDING);
    });

    it('should return empty array when association has no invites', async () => {
      prismaService.invite.findMany.mockResolvedValue([]);

      const result = await service.getAssociationInvites(999);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should filter by ACCEPTED status', async () => {
      const associationId = 1;
      const mockInvites = [
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

      prismaService.invite.findMany.mockResolvedValue(mockInvites as any);

      const result = await service.getAssociationInvites(
        associationId,
        InviteStatus.ACCEPTED,
      );

      expect(prismaService.invite.findMany).toHaveBeenCalledWith({
        where: {
          associationId: 1,
          status: InviteStatus.ACCEPTED,
        },
        include: expect.any(Object),
        orderBy: { sentAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(InviteStatus.ACCEPTED);
    });

    it('should filter by DECLINED status', async () => {
      const associationId = 1;

      prismaService.invite.findMany.mockResolvedValue([]);

      await service.getAssociationInvites(associationId, InviteStatus.DECLINED);

      expect(prismaService.invite.findMany).toHaveBeenCalledWith({
        where: {
          associationId: 1,
          status: InviteStatus.DECLINED,
        },
        include: expect.any(Object),
        orderBy: { sentAt: 'desc' },
      });
    });
  });
});

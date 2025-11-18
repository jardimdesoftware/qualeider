import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvitesService } from '@/application/services/invites/invites.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { createMockEventEmitter } from '../../../mocks/event-emitter.mock';
import { createInvite } from '../../../factories/invite.factory';
import { createUser } from '../../../factories/user.factory';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { InviteStatus, InviteAction } from '@/domain/enums/enums';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { INVITE_EXPIRATION_DAYS } from '@/common/constants/business-rules.constants';

describe('InvitesService', () => {
  let service: InvitesService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    eventEmitter = createMockEventEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<InvitesService>(InvitesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvite', () => {
    it('deve criar um convite com sucesso', async () => {
      const associationId = 1;
      const dto: CreateInviteDto = {
        userId: 2,
        message: 'Junte-se à nossa associação!',
      };
      const mockAssociation = { id: associationId, name: 'Associação ABC' };
      const mockUser = createUser({ id: dto.userId, associationId: null });
      const mockInvite = createInvite({
        id: 1,
        associationId,
        userId: dto.userId,
        message: dto.message,
        status: InviteStatus.PENDING,
        user: mockUser as any,
        association: mockAssociation as any,
      });
      prisma.association.findUnique.mockResolvedValue(mockAssociation as any);
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.invite.findFirst.mockResolvedValue(null);
      prisma.invite.create.mockResolvedValue(mockInvite as any);

      const result = await service.createInvite(associationId, dto);

      expect(result).toHaveProperty('id', 1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.created',
        expect.any(Object),
      );
    });

    it('deve lançar EntityNotFoundException se associação não existe', async () => {
      const dto: CreateInviteDto = { userId: 2 };
      prisma.association.findUnique.mockResolvedValue(null);

      await expect(service.createInvite(999, dto)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.createInvite(999, dto)).rejects.toThrow(
        'Associação não encontrada',
      );
    });

    it('deve lançar EntityNotFoundException se usuário não existe', async () => {
      const dto: CreateInviteDto = { userId: 999 };
      const mockAssociation = { id: 1, name: 'Associação ABC' };

      prisma.association.findUnique.mockResolvedValue(mockAssociation as any);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.createInvite(1, dto)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.createInvite(1, dto)).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('deve lançar BusinessException se usuário já está na associação', async () => {
      const associationId = 1;
      const dto: CreateInviteDto = { userId: 2 };
      const mockAssociation = { id: associationId, name: 'Associação ABC' };
      const mockUser = createUser({ id: dto.userId, associationId });

      prisma.association.findUnique.mockResolvedValue(mockAssociation as any);
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.createInvite(associationId, dto)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.createInvite(associationId, dto)).rejects.toThrow(
        'Usuário já está vinculado a esta associação',
      );
    });

    it('deve lançar BusinessException se já existe convite pendente', async () => {
      const associationId = 1;
      const dto: CreateInviteDto = { userId: 2 };
      const mockAssociation = { id: associationId, name: 'Associação ABC' };
      const mockUser = createUser({ id: dto.userId, associationId: null });
      const existingInvite = createInvite({
        associationId,
        userId: dto.userId,
        status: InviteStatus.PENDING,
      });

      prisma.association.findUnique.mockResolvedValue(mockAssociation as any);
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.invite.findFirst.mockResolvedValue(existingInvite as any);

      await expect(service.createInvite(associationId, dto)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.createInvite(associationId, dto)).rejects.toThrow(
        'Já existe um convite pendente para este usuário',
      );
    });
  });

  describe('respondToInvite', () => {
    it('deve aceitar convite com sucesso', async () => {
      const token = 'valid-token';

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + INVITE_EXPIRATION_DAYS);

      const mockInvite = createInvite({
        id: 1,
        token,
        status: InviteStatus.PENDING,
        expiresAt: futureDate,
        user: createUser({ id: 2, name: 'João' }) as any,
        association: { id: 1, name: 'Associação ABC' } as any,
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);
      prisma.$transaction.mockResolvedValue([mockInvite, createUser()] as any);

      const result = await service.respondToInvite(token, InviteAction.ACCEPT);

      expect(result).toHaveProperty(
        'message',
        'Você agora faz parte da Associação ABC!',
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.accepted',
        expect.any(Object),
      );
    });

    it('deve recusar convite com sucesso', async () => {
      const token = 'valid-token';

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + INVITE_EXPIRATION_DAYS);

      const mockInvite = createInvite({
        id: 1,
        token,
        status: InviteStatus.PENDING,
        expiresAt: futureDate,
        user: createUser({ id: 2, name: 'João' }) as any,
        association: { id: 1, name: 'Associação ABC' } as any,
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);
      prisma.invite.update.mockResolvedValue(mockInvite as any);
      const result = await service.respondToInvite(token, InviteAction.DECLINE);
      expect(result).toHaveProperty('message', 'Convite recusado');
    });

    it('deve lançar BusinessException se convite expirou', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - INVITE_EXPIRATION_DAYS);

      const mockInvite = createInvite({
        status: InviteStatus.PENDING,
        expiresAt: pastDate,
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);
      prisma.invite.update.mockResolvedValue(mockInvite as any);

      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow(BusinessException);
      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow('Convite expirado');
    });
  });

  describe('getUserPendingInvites', () => {
    it('deve retornar convites pendentes de um usuário', async () => {
      const userId = 1;
      const mockInvites = [createInvite({ id: 1, userId })];
      prisma.invite.findMany.mockResolvedValue(mockInvites as any);

      const result = await service.getUserPendingInvites(userId);

      expect(result).toHaveLength(1);
    });

    it('deve retornar array vazio se não há convites pendentes', async () => {
      prisma.invite.findMany.mockResolvedValue([]);

      const result = await service.getUserPendingInvites(999);

      expect(result).toEqual([]);
    });
  });

  describe('getAssociationInvites', () => {
    it('deve retornar todos os convites de uma associação', async () => {
      const associationId = 1;
      const mockInvites = [createInvite({ id: 1, associationId })];
      prisma.invite.findMany.mockResolvedValue(mockInvites as any);

      const result = await service.getAssociationInvites(associationId);

      expect(result).toHaveLength(1);
    });

    it('deve filtrar por status quando fornecido', async () => {
      const associationId = 1;
      const mockInvites = [
        createInvite({ id: 1, status: InviteStatus.ACCEPTED }),
      ];
      prisma.invite.findMany.mockResolvedValue(mockInvites as any);

      const result = await service.getAssociationInvites(
        associationId,
        InviteStatus.ACCEPTED,
      );

      expect(result).toHaveLength(1);
      expect(prisma.invite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            associationId,
            status: InviteStatus.ACCEPTED,
          },
        }),
      );
    });
  });

  describe('cancelInvite', () => {
    it('deve cancelar convite pendente com sucesso', async () => {
      const associationId = 1;
      const inviteId = 1;
      const mockInvite = createInvite({
        id: inviteId,
        associationId,
        status: InviteStatus.PENDING,
      });
      prisma.invite.findFirst.mockResolvedValue(mockInvite as any);
      prisma.invite.update.mockResolvedValue({
        ...mockInvite,
        status: InviteStatus.CANCELED,
      } as any);

      const result = await service.cancelInvite(associationId, inviteId);

      expect(result).toHaveProperty('message', 'Convite cancelado com sucesso');
    });

    it('deve lançar EntityNotFoundException se convite não existe', async () => {
      prisma.invite.findFirst.mockResolvedValue(null);

      await expect(service.cancelInvite(1, 999)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.cancelInvite(1, 999)).rejects.toThrow(
        'Convite não encontrado ou já foi respondido',
      );
    });
  });

  describe('respondToInvite', () => {
    it('deve aceitar convite com sucesso', async () => {
      const token = 'valid-token';

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + INVITE_EXPIRATION_DAYS);

      const mockInvite = createInvite({
        id: 1,
        token,
        status: InviteStatus.PENDING,
        expiresAt: futureDate, // <-- Data corrigida
        user: createUser({ id: 2, name: 'João' }) as any,
        association: { id: 1, name: 'Associação ABC' } as any,
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);
      prisma.$transaction.mockResolvedValue([mockInvite, createUser()] as any);

      const result = await service.respondToInvite(token, InviteAction.ACCEPT);

      expect(result).toHaveProperty(
        'message',
        'Você agora faz parte da Associação ABC!',
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.accepted',
        expect.any(Object),
      );
    });

    it('deve recusar convite com sucesso', async () => {
      const token = 'valid-token';

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + INVITE_EXPIRATION_DAYS);

      const mockInvite = createInvite({
        id: 1,
        token,
        status: InviteStatus.PENDING,
        expiresAt: futureDate,
        user: createUser({ id: 2, name: 'João' }) as any,
        association: { id: 1, name: 'Associação ABC' } as any,
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);
      prisma.invite.update.mockResolvedValue(mockInvite as any);
      const result = await service.respondToInvite(token, InviteAction.DECLINE);
      expect(result).toHaveProperty('message', 'Convite recusado');
    });

    it('deve lançar BusinessException se convite expirou', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - INVITE_EXPIRATION_DAYS);

      const mockInvite = createInvite({
        status: InviteStatus.PENDING,
        expiresAt: pastDate,
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);
      prisma.invite.update.mockResolvedValue(mockInvite as any);

      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow(BusinessException);
      await expect(
        service.respondToInvite('token', InviteAction.ACCEPT),
      ).rejects.toThrow('Convite expirado');
    });
  });

  it('deve lançar EntityNotFoundException se convite não existe', async () => {
    prisma.invite.findUnique.mockResolvedValue(null);

    await expect(service.getInviteByToken('invalid-token')).rejects.toThrow(
      EntityNotFoundException,
    );
    await expect(service.getInviteByToken('invalid-token')).rejects.toThrow(
      'Convite não encontrado',
    );
  });
});

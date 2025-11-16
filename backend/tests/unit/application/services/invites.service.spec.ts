import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvitesService } from '@/application/services/invites/invites.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { createMockEventEmitter } from '../../../mocks/event-emitter.mock';
import { createInvite } from '../../../factories/invite.factory';
import { createUser } from '../../../factories/user.factory';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { InviteStatus } from '@/application/enums/invite-status.enum';

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
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('message', 'Convite enviado com sucesso');
      expect(result).toHaveProperty('expiresAt');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.created',
        expect.any(Object),
      );
    });

    it('deve lançar NotFoundException se associação não existe', async () => {
      const dto: CreateInviteDto = { userId: 2 };

      prisma.association.findUnique.mockResolvedValue(null);

      await expect(service.createInvite(999, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createInvite(999, dto)).rejects.toThrow(
        'Associação não encontrada',
      );
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      const dto: CreateInviteDto = { userId: 999 };
      const mockAssociation = { id: 1, name: 'Associação ABC' };

      prisma.association.findUnique.mockResolvedValue(mockAssociation as any);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.createInvite(1, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createInvite(1, dto)).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('deve lançar ConflictException se usuário já está na associação', async () => {
      const associationId = 1;
      const dto: CreateInviteDto = { userId: 2 };
      const mockAssociation = { id: associationId, name: 'Associação ABC' };
      const mockUser = createUser({ id: dto.userId, associationId });

      prisma.association.findUnique.mockResolvedValue(mockAssociation as any);
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.createInvite(associationId, dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createInvite(associationId, dto)).rejects.toThrow(
        'Usuário já está vinculado a esta associação',
      );
    });

    it('deve lançar ConflictException se já existe convite pendente', async () => {
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
        ConflictException,
      );
      await expect(service.createInvite(associationId, dto)).rejects.toThrow(
        'Já existe um convite pendente para este usuário',
      );
    });
  });

  describe('respondToInvite', () => {
    it('deve aceitar convite com sucesso', async () => {
      const token = 'valid-token';
      const mockInvite = createInvite({
        id: 1,
        token,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        user: createUser({ id: 2, name: 'João' }) as any,
        association: { id: 1, name: 'Associação ABC' } as any,
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);
      prisma.$transaction.mockResolvedValue([mockInvite, createUser()] as any);

      const result = await service.respondToInvite(token, 'accept');

      expect(result).toHaveProperty(
        'message',
        'Você agora faz parte da Associação ABC!',
      );
      expect(result).toHaveProperty('associationId', 1);
      expect(result).toHaveProperty('associationName', 'Associação ABC');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.accepted',
        expect.any(Object),
      );
    });

    it('deve recusar convite com sucesso', async () => {
      const token = 'valid-token';
      const mockInvite = createInvite({
        id: 1,
        token,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        user: createUser({ id: 2, name: 'João' }) as any,
        association: { id: 1, name: 'Associação ABC' } as any,
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);
      prisma.invite.update.mockResolvedValue(mockInvite as any);

      const result = await service.respondToInvite(token, 'decline');

      expect(result).toHaveProperty('message', 'Convite recusado');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'invite.declined',
        expect.any(Object),
      );
    });

    it('deve lançar NotFoundException se convite não existe', async () => {
      prisma.invite.findUnique.mockResolvedValue(null);

      await expect(
        service.respondToInvite('invalid-token', 'accept'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.respondToInvite('invalid-token', 'accept'),
      ).rejects.toThrow('Convite não encontrado');
    });

    it('deve lançar BadRequestException se convite já foi respondido', async () => {
      const mockInvite = createInvite({
        status: InviteStatus.ACCEPTED,
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);

      await expect(service.respondToInvite('token', 'accept')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.respondToInvite('token', 'accept')).rejects.toThrow(
        'Convite já foi accepted',
      );
    });

    it('deve lançar BadRequestException se convite expirou', async () => {
      const mockInvite = createInvite({
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() - 86400000), // 1 dia atrás
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);
      prisma.invite.update.mockResolvedValue(mockInvite as any);

      await expect(service.respondToInvite('token', 'accept')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.respondToInvite('token', 'accept')).rejects.toThrow(
        'Convite expirado',
      );
    });
  });

  describe('getUserPendingInvites', () => {
    it('deve retornar convites pendentes de um usuário', async () => {
      const userId = 1;
      const mockInvites = [
        createInvite({
          id: 1,
          userId,
          status: InviteStatus.PENDING,
          association: { id: 1, name: 'Associação A' } as any,
        }),
        createInvite({
          id: 2,
          userId,
          status: InviteStatus.PENDING,
          association: { id: 2, name: 'Associação B' } as any,
        }),
      ];

      prisma.invite.findMany.mockResolvedValue(mockInvites as any);

      const result = await service.getUserPendingInvites(userId);

      expect(result).toHaveLength(2);
      expect(prisma.invite.findMany).toHaveBeenCalledWith({
        where: {
          userId,
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
      const mockInvites = [
        createInvite({ id: 1, associationId }),
        createInvite({ id: 2, associationId }),
      ];

      prisma.invite.findMany.mockResolvedValue(mockInvites as any);

      const result = await service.getAssociationInvites(associationId);

      expect(result).toHaveLength(2);
      expect(prisma.invite.findMany).toHaveBeenCalledWith({
        where: { associationId },
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
      expect(prisma.invite.findMany).toHaveBeenCalledWith({
        where: {
          associationId,
          status: InviteStatus.ACCEPTED,
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
      expect(prisma.invite.update).toHaveBeenCalledWith({
        where: { id: inviteId },
        data: {
          status: InviteStatus.CANCELED,
          respondedAt: expect.any(Date),
        },
      });
    });

    it('deve lançar NotFoundException se convite não existe', async () => {
      prisma.invite.findFirst.mockResolvedValue(null);

      await expect(service.cancelInvite(1, 999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.cancelInvite(1, 999)).rejects.toThrow(
        'Convite não encontrado ou já foi respondido',
      );
    });
  });

  describe('getInviteByToken', () => {
    it('deve retornar dados do convite pelo token', async () => {
      const token = 'valid-token';
      const mockInvite = createInvite({
        id: 1,
        token,
        status: InviteStatus.PENDING,
        message: 'Bem-vindo!',
        expiresAt: new Date(Date.now() + 86400000),
        user: createUser({ id: 2, name: 'João' }) as any,
        association: { id: 1, name: 'Associação ABC' } as any,
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);

      const result = await service.getInviteByToken(token);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('status', InviteStatus.PENDING);
      expect(result).toHaveProperty('message', 'Bem-vindo!');
      expect(result).toHaveProperty('isExpired', false);
      expect(result).toHaveProperty('association');
      expect(result).toHaveProperty('user');
    });

    it('deve identificar convite expirado', async () => {
      const token = 'expired-token';
      const mockInvite = createInvite({
        token,
        expiresAt: new Date(Date.now() - 86400000),
      });

      prisma.invite.findUnique.mockResolvedValue(mockInvite as any);

      const result = await service.getInviteByToken(token);

      expect(result).toHaveProperty('isExpired', true);
    });

    it('deve lançar NotFoundException se convite não existe', async () => {
      prisma.invite.findUnique.mockResolvedValue(null);

      await expect(service.getInviteByToken('invalid-token')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getInviteByToken('invalid-token')).rejects.toThrow(
        'Convite não encontrado',
      );
    });
  });
});

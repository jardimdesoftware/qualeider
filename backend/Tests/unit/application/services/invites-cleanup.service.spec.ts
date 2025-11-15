import { Test, TestingModule } from '@nestjs/testing';
import { InvitesCleanupService } from '@/application/services/invites/invites-cleanup.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { InviteStatus } from '@/application/enums/invite-status.enum';

describe('InvitesCleanupService', () => {
  let service: InvitesCleanupService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesCleanupService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<InvitesCleanupService>(InvitesCleanupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('expireOldInvites', () => {
    it('deve marcar convites pendentes expirados como EXPIRED', async () => {
      const mockUpdateResult = { count: 3 };
      prisma.invite.updateMany.mockResolvedValue(mockUpdateResult as any);

      const result = await service.expireOldInvites();

      expect(result).toEqual({
        success: true,
        expiredCount: 3,
        timestamp: expect.any(Date),
      });

      expect(prisma.invite.updateMany).toHaveBeenCalledWith({
        where: {
          status: InviteStatus.PENDING,
          expiresAt: {
            lt: expect.any(Date),
          },
        },
        data: {
          status: InviteStatus.EXPIRED,
        },
      });
    });

    it('deve retornar count zero se não houver convites expirados', async () => {
      const mockUpdateResult = { count: 0 };
      prisma.invite.updateMany.mockResolvedValue(mockUpdateResult as any);

      const result = await service.expireOldInvites();

      expect(result).toEqual({
        success: true,
        expiredCount: 0,
        timestamp: expect.any(Date),
      });
    });

    it('deve usar a data atual para comparar expiração', async () => {
      const beforeCall = new Date();
      prisma.invite.updateMany.mockResolvedValue({ count: 2 } as any);

      await service.expireOldInvites();

      const callArgs = prisma.invite.updateMany.mock.calls[0][0];
      const usedDate = callArgs.where.expiresAt.lt;

      expect(usedDate).toBeInstanceOf(Date);
      expect(usedDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    });

    it('deve atualizar apenas convites com status PENDING', async () => {
      prisma.invite.updateMany.mockResolvedValue({ count: 1 } as any);

      await service.expireOldInvites();

      expect(prisma.invite.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: InviteStatus.PENDING,
          }),
        }),
      );
    });

    it('deve atualizar status para EXPIRED', async () => {
      prisma.invite.updateMany.mockResolvedValue({ count: 5 } as any);

      await service.expireOldInvites();

      expect(prisma.invite.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: InviteStatus.EXPIRED,
          },
        }),
      );
    });

    it('deve retornar success true sempre', async () => {
      prisma.invite.updateMany.mockResolvedValue({ count: 10 } as any);

      const result = await service.expireOldInvites();

      expect(result.success).toBe(true);
    });

    it('deve incluir timestamp no resultado', async () => {
      const before = new Date();
      prisma.invite.updateMany.mockResolvedValue({ count: 1 } as any);

      const result = await service.expireOldInvites();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe('manualExpireCheck', () => {
    it('deve executar a mesma lógica de expireOldInvites', async () => {
      const mockUpdateResult = { count: 7 };
      prisma.invite.updateMany.mockResolvedValue(mockUpdateResult as any);

      const result = await service.manualExpireCheck();

      expect(result).toEqual({
        success: true,
        expiredCount: 7,
        timestamp: expect.any(Date),
      });

      expect(prisma.invite.updateMany).toHaveBeenCalled();
    });

    it('deve permitir execução manual fora do CRON', async () => {
      prisma.invite.updateMany.mockResolvedValue({ count: 2 } as any);

      await service.manualExpireCheck();

      expect(prisma.invite.updateMany).toHaveBeenCalledTimes(1);
    });
  });
});

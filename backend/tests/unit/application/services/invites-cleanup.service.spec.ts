import { Test, TestingModule } from '@nestjs/testing';
import { InvitesCleanupService } from '@/application/services/invites/invites-cleanup.service';
import { IInviteRepository } from '@/domain/repositories/invite.repository';

describe('InvitesCleanupService', () => {
  let service: InvitesCleanupService;
  let inviteRepository: jest.Mocked<IInviteRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesCleanupService,
        {
          provide: IInviteRepository,
          useValue: {
            expireOldInvites: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByToken: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvitesCleanupService>(InvitesCleanupService);
    inviteRepository = module.get(IInviteRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('expireOldInvites', () => {
    it('deve chamar expireOldInvites do repositório', async () => {
      inviteRepository.expireOldInvites.mockResolvedValue(5);

      const result = await service.expireOldInvites();

      expect(inviteRepository.expireOldInvites).toHaveBeenCalled();
      expect(result.expiredCount).toBe(5);
      expect(result.success).toBe(true);
    });

    it('deve retornar zero quando nenhum convite for expirado', async () => {
      inviteRepository.expireOldInvites.mockResolvedValue(0);

      const result = await service.expireOldInvites();

      expect(result.expiredCount).toBe(0);
    });
  });

  describe('manualExpireCheck', () => {
    it('deve chamar expireOldInvites manualmente', async () => {
      inviteRepository.expireOldInvites.mockResolvedValue(3);

      const result = await service.manualExpireCheck();

      expect(inviteRepository.expireOldInvites).toHaveBeenCalled();
      expect(result.expiredCount).toBe(3);
    });
  });
});

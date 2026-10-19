import { ForbiddenException } from '@nestjs/common';
import { ActivityLogService } from '@/application/services/activity-logs/activity-logs.service';
import { IActivityLogRepository } from '@/domain/repositories/activity-log.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { ActivityEventType, UserRole } from '@/domain/enums/enums';
import { createUser } from '../../../factories';

describe('ActivityLogService', () => {
  let activityLogRepository: jest.Mocked<IActivityLogRepository>;
  let userRepository: jest.Mocked<Pick<IUserRepository, 'findByIdAny'>>;
  let service: ActivityLogService;

  const page = { data: [], total: 0, page: 1, limit: 50, totalPages: 0, hasNextPage: false, hasPreviousPage: false };

  beforeEach(() => {
    activityLogRepository = { create: jest.fn(), findAll: jest.fn().mockResolvedValue(page) } as any;
    userRepository = { findByIdAny: jest.fn() };
    service = new ActivityLogService(activityLogRepository, userRepository as unknown as IUserRepository);
  });

  describe('record', () => {
    it('grava o evento de atividade', async () => {
      await service.record(1, ActivityEventType.LOGIN, { origem: 'teste' });

      expect(activityLogRepository.create).toHaveBeenCalledWith({
        userId: 1,
        eventType: ActivityEventType.LOGIN,
        metadata: { origem: 'teste' },
      });
    });

    it('nunca lança erro: falha ao gravar só é registrada em log', async () => {
      activityLogRepository.create.mockRejectedValue(new Error('banco fora'));

      await expect(service.record(1, ActivityEventType.LOGIN)).resolves.toBeUndefined();
    });

    it('também aguenta erro que não é Error', async () => {
      activityLogRepository.create.mockRejectedValue('falhou');

      await expect(service.record(1, ActivityEventType.ANIMAL_CREATED)).resolves.toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('só ADMIN vê o histórico', async () => {
      await expect(service.findAll(2, { id: 5, role: UserRole.VAQUEIRO, adminId: 1 })).rejects.toThrow(
        ForbiddenException,
      );
      expect(activityLogRepository.findAll).not.toHaveBeenCalled();
    });

    it('o admin vê o próprio histórico sem consultar o alvo', async () => {
      const result = await service.findAll(1, { id: 1, role: UserRole.ADMIN }, { page: 2, limit: 10 });

      expect(userRepository.findByIdAny).not.toHaveBeenCalled();
      expect(activityLogRepository.findAll).toHaveBeenCalledWith({ userId: 1, page: 2, limit: 10 });
      expect(result).toBe(page);
    });

    it('o admin vê o histórico de uma conta do mesmo grupo (inclusive criada por outro admin)', async () => {
      userRepository.findByIdAny.mockResolvedValue(createUser({ id: 9, role: UserRole.VAQUEIRO, adminId: 1 }));

      await service.findAll(9, { id: 7, role: UserRole.ADMIN, adminId: 1 });

      expect(activityLogRepository.findAll).toHaveBeenCalledWith({ userId: 9 });
    });

    it('nega o histórico de uma conta de outro grupo', async () => {
      userRepository.findByIdAny.mockResolvedValue(createUser({ id: 50, role: UserRole.ADMIN, adminId: null }));

      await expect(service.findAll(50, { id: 7, role: UserRole.ADMIN, adminId: 1 })).rejects.toThrow(
        ForbiddenException,
      );
      expect(activityLogRepository.findAll).not.toHaveBeenCalled();
    });

    it('retorna não encontrado quando o usuário alvo não existe', async () => {
      userRepository.findByIdAny.mockResolvedValue(null);

      await expect(service.findAll(999, { id: 1, role: UserRole.ADMIN })).rejects.toThrow(EntityNotFoundException);
    });
  });
});

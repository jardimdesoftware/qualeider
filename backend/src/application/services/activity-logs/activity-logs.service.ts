import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { IActivityLogRepository } from '@/domain/repositories/activity-log.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ActivityLogCriteria } from '@/domain/criteria/activity-log.criteria';
import { PaginatedResult, PaginationParams } from '@/domain/common/pagination.interface';
import { ActivityLogEntity } from '@/domain/entities/activity-log.entity';
import { ActivityEventType, ID, UserRole } from '@/domain/enums/enums';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { isSameHerd } from '@/domain/utils/herd-scope.util';
import { RequesterContext } from '@/application/services/users/users.service';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @Inject(IActivityLogRepository) private readonly activityLogRepository: IActivityLogRepository,
    @Inject(IUserRepository) private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Registra um evento de atividade. Nunca lanca erro: uma falha ao gravar o
   * historico nao pode derrubar o fluxo principal (login, criar coleta,
   * criar animal). Erros sao apenas logados.
   */
  async record(
    userId: ID,
    eventType: ActivityEventType,
    metadata?: Record<string, unknown> | null,
  ): Promise<void> {
    try {
      await this.activityLogRepository.create({ userId, eventType, metadata });
    } catch (error) {
      this.logger.error(
        `Falha ao registrar atividade (userId=${userId}, eventType=${eventType})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Lista o historico de atividade de um usuario. Requer que o requisitante
   * seja ADMIN e pertenca ao mesmo rebanho do usuario alvo (ou seja o proprio
   * usuario), mesmo mecanismo de autorizacao usado em AnimalsService.
   */
  async findAll(
    userId: ID,
    requester: RequesterContext,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ActivityLogEntity>> {
    if (requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para ver este histórico de atividade.');
    }

    if (requester.id !== userId) {
      const target = await this.userRepository.findByIdAny(userId);
      if (!target) {
        throw new EntityNotFoundException(`Usuário com ID ${userId} não encontrado.`);
      }

      if (!isSameHerd(requester as any, target as any)) {
        throw new ForbiddenException('Você não tem permissão para ver este histórico de atividade.');
      }
    }

    const criteria: ActivityLogCriteria = { userId, ...pagination };
    return this.activityLogRepository.findAll(criteria);
  }
}

import { ID, ActivityEventType } from '@/domain/enums/enums';
import { ActivityLogEntity } from '@/domain/entities/activity-log.entity';
import { ActivityLogCriteria } from '@/domain/criteria/activity-log.criteria';
import { PaginatedResult } from '@/domain/common/pagination.interface';

export const IActivityLogRepository = Symbol('IActivityLogRepository');

export interface CreateActivityLogData {
  userId: ID;
  eventType: ActivityEventType;
  metadata?: Record<string, unknown> | null;
}

export interface IActivityLogRepository {
  create(data: CreateActivityLogData): Promise<ActivityLogEntity>;
  findAll(criteria: ActivityLogCriteria): Promise<PaginatedResult<ActivityLogEntity>>;
}

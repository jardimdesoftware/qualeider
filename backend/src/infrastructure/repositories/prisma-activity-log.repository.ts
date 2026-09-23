import { Injectable } from '@nestjs/common';
import { ActivityEventType as PrismaActivityEventType, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  IActivityLogRepository,
  CreateActivityLogData,
} from '@/domain/repositories/activity-log.repository';
import { ActivityLogEntity } from '@/domain/entities/activity-log.entity';
import { ActivityLogCriteria } from '@/domain/criteria/activity-log.criteria';
import { ActivityLogMapper } from '@/infrastructure/mappers/activity-log.mapper';
import {
  PaginatedResult,
  normalizePaginationParams,
  createPaginatedResult,
} from '@/domain/common/pagination.interface';

@Injectable()
export class PrismaActivityLogRepository implements IActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateActivityLogData): Promise<ActivityLogEntity> {
    const created = await this.prisma.activityLog.create({
      data: {
        userId: data.userId,
        eventType: data.eventType as unknown as PrismaActivityEventType,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
    return ActivityLogMapper.toDomain(created);
  }

  async findAll(criteria: ActivityLogCriteria): Promise<PaginatedResult<ActivityLogEntity>> {
    const where = { userId: criteria.userId };

    const { page, limit, skip } = normalizePaginationParams(criteria);

    const [total, list] = await Promise.all([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const data = list.map(ActivityLogMapper.toDomain);

    return createPaginatedResult(data, total, page, limit);
  }
}

import { ActivityLogEntity } from '@/domain/entities/activity-log.entity';
import { ActivityLog as PrismaActivityLog } from '@prisma/client';
import { ActivityEventType } from '@/domain/enums/enums';

export class ActivityLogMapper {
  static toDomain(raw: PrismaActivityLog): ActivityLogEntity {
    return new ActivityLogEntity({
      id: raw.id,
      userId: raw.userId,
      eventType: raw.eventType as unknown as ActivityEventType,
      metadata: (raw.metadata as Record<string, unknown> | null) ?? null,
      createdAt: raw.createdAt,
    });
  }
}

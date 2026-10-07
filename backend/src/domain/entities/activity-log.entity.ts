import { ID, ActivityEventType } from '@/domain/enums/enums';

export class ActivityLogEntity {
  constructor(props?: Partial<ActivityLogEntity>) {
    if (props) Object.assign(this, props);
  }
  id!: ID;
  userId!: ID;
  eventType!: ActivityEventType;
  metadata?: Record<string, unknown> | null;
  createdAt!: Date;
}

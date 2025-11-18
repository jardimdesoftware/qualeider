
import { NotificationType } from '@/domain/enums/enums';
export class NotificationEvent {
  constructor(
    public readonly type: NotificationType,
    public readonly associationId: number,
    public readonly subject: string,
    public readonly message: string,
    public readonly userIds?: number[], 
    public readonly template?: string,
  ) {}
}
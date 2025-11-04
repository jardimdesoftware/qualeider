// backend/src/events/notification.events.ts
export class NotificationEvent {
  constructor(
    public readonly type: 'individual' | 'collective',
    public readonly associationId: number,
    public readonly subject: string,
    public readonly message: string,
    public readonly userIds?: number[], 
    public readonly template?: string,
  ) {}
}
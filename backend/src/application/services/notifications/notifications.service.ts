import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent } from '@/events/notification.events';
import { NotificationSendPayload } from '@/events/notification-payload.interface';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async notifyProducers(event: NotificationEvent) {
    const users = await this.getTargetUsers(event);

    for (const user of users) {
      const payload: NotificationSendPayload = {
        to: user.email,
        subject: event.subject,
        message: event.message,
        userName: user.name,
      };

      this.eventEmitter.emit('notification.send', payload);
    }
  }

  private async getTargetUsers(event: NotificationEvent) {
    if (event.type === 'individual') {
      return this.prisma.user.findMany({
        where: {
          id: { in: event.userIds },
          associationId: event.associationId,
        },
      });
    } else {
      return this.prisma.user.findMany({
        where: { associationId: event.associationId },
      });
    }
  }
}

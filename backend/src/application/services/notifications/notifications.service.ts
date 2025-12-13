import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent } from '@/events/notification.events';
import { NotificationSendPayload } from '@/events/notification-payload.interface';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  async notifyProducers(event: NotificationEvent) {
    const users = await this.getTargetUsers(event);

    const notification = await this.prisma.notification.create({
      data: {
        associationId: event.associationId,
        subject: event.subject,
        message: event.message,
        recipients: {
          create: users.map((user) => ({
            userId: user.id as number,
          })),
        },
      },
    });

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
    if (event.type === 'Individual') {
      return this.userRepository.findAll({
        ids: event.userIds,
        associationId: event.associationId,
      });
    } else {
      return this.userRepository.findAll({
        associationId: event.associationId,
      });
    }
  }

  async getUserNotifications(userId: number) {
    return this.prisma.notificationRecipient.findMany({
        where: { userId },
        include: {
            notification: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
  }

  async markAsRead(recipientId: number) {
    return this.prisma.notificationRecipient.update({
        where: { id: recipientId },
        data: { read: true, readAt: new Date() }
    });
  }
}

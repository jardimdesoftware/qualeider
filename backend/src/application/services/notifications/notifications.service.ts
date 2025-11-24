import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent } from '@/events/notification.events';
import { NotificationSendPayload } from '@/events/notification-payload.interface';
import { IUserRepository } from '@/domain/repositories/user.repository';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
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
}

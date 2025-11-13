import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '@/application/services/notifications/notifications.service';
import { SendNotificationDto } from '@/application/dtos/notifications/send-notification.dto';
import { NotificationEvent } from '@/events/notification.events';

@Controller('notifications')
@ApiTags('Notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Envia notificação para produtores' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    const event = new NotificationEvent(
      dto.type,
      dto.associationId,
      dto.subject,
      dto.message,
      dto.userIds,
      dto.template,
    );

    await this.notificationsService.notifyProducers(event);

    return {
      message: 'Notificação enviada com sucesso',
      count: dto.type === 'individual' ? dto.userIds?.length : 'todos',
    };
  }
}

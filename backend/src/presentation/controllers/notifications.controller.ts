import { Body, Controller, Post, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_TTL } from '@/common/throttler/throttler.config';
import { ApiOperation, ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from '@/application/services/notifications/notifications.service';
import { SendNotificationDto } from '@/application/dtos/notifications/send-notification.dto';
import { NotificationEvent } from '@/events/notification.events';
import { NotificationType } from '@/domain/enums/enums';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@Controller('notifications')
@ApiTags('Notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Throttle({ default: { limit: 5, ttl: THROTTLE_TTL.LONG } })
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Envia notificação para produtores' })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({
    status: 201,
    description: 'Notificação enviada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou erro de negócio' })
  @ApiResponse({ status: 404, description: 'Associação ou usuários não encontrados' })
  @ResponseMessage('Notificação enviada com sucesso')
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

    const count = dto.type === NotificationType.INDIVIDUAL ? dto.userIds?.length : 'todos';
    return { count };
  }

  @Get('user/me')

  @ApiOperation({ summary: 'Obter notificações do usuário logado' })
  @ApiBody({ type: GetUser })
  @ApiResponse({ status: 200, description: 'Lista de notificações retornada.' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @ResponseMessage('Notificações listadas com sucesso')
  async getMyNotifications(@GetUser('id') userId: number) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Post('read/:id')

  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida.' })
  @ResponseMessage('Notificação marcada como lida')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(Number(id));
  }
}
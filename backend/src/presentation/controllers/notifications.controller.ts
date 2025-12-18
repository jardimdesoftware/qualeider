import { Body, Controller, Post, HttpStatus, HttpCode, Get, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '@/application/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_TTL } from '@/common/throttler/throttler.config';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from '@/application/services/notifications/notifications.service';
import { SendNotificationDto } from '@/application/dtos/notifications/send-notification.dto';
import { NotificationEvent } from '@/events/notification.events';
import { NotificationType } from '@/domain/enums/enums';

@Controller('notifications')
@ApiTags('Notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Throttle({ default: { limit: 5, ttl: THROTTLE_TTL.LONG } })
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Envia notificação para produtores' })
  @ApiResponse({
    status: 201,
    description: 'Notificação enviada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou erro de negócio' })
  @ApiResponse({ status: 404, description: 'Associação ou usuários não encontrados' })
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

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Notificação enviada com sucesso',
      data: { count },
    };
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter notificações do usuário logado' })
  @ApiResponse({ status: 200, description: 'Lista de notificações retornada.' })
  async getMyNotifications(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notificationsService.getUserNotifications(userId);
  }

  @Post('read/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida.' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(Number(id));
  }
}
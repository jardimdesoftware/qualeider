import { Module } from '@nestjs/common';
import { NotificationsApplicationModule } from '@/application/services/notifications/notifications.module';
import { NotificationsController } from '../controllers/notifications.controller';

@Module({
  imports: [NotificationsApplicationModule],
  controllers: [NotificationsController],
})
export class NotificationsPresentationModule {}

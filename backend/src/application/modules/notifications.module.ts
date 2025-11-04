import { Module } from '@nestjs/common';
import { NotificationsTestController } from '@/presentation/controllers/notifications-test.controller';

@Module({
  imports: [],
  controllers: [NotificationsTestController],
  providers: [],
  exports: [],
})
export class NotificationsModule {}

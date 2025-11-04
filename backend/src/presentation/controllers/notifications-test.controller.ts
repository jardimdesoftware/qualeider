import { Controller, Post } from '@nestjs/common';

@Controller('notifications-test')
export class NotificationsTestController {
  @Post('ping')
  ping() {
    return { message: 'pong' };
  }
}

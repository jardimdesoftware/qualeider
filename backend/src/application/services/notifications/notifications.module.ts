import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { MailModule } from '@/mail/mail.module';
import { NotificationsService } from './notifications.service';
import { EmailListener } from '@/listener/email.listener';

@Module({
  imports: [InfrastructureModule, MailModule],
  // EmailListener é usado via @OnEvent decorators (runtime detection)
  providers: [NotificationsService, EmailListener],
  exports: [NotificationsService],
})
export class NotificationsApplicationModule {}

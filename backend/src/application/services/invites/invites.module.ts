import { Module } from '@nestjs/common';
import { InvitesService } from '@/application/services/invites/invites.service';
import { InvitesCleanupService } from '@/application/services/invites/invites-cleanup.service';
import { InviteEmailListener } from '@/listener/invite-email.listener';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [InfrastructureModule, MailModule],
  providers: [InvitesService, InvitesCleanupService, InviteEmailListener],
  exports: [InvitesService],
})
export class InvitesApplicationModule {}

import { Module } from '@nestjs/common';
import { InvitesService } from '@/application/services/invites/invites.service';
import { InvitesCleanupService } from '@/application/services/invites/invites-cleanup.service';
import { InviteEmailListener } from '@/listener/invite-email.listener';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { MailModule } from '@/mail/mail.module';

import { InviteDomainService } from '@/domain/services/invite.domain-service';

@Module({
  imports: [InfrastructureModule, MailModule],
  providers: [InvitesService, InvitesCleanupService, InviteEmailListener, InviteDomainService],
  exports: [InvitesService],
})
export class InvitesApplicationModule {}

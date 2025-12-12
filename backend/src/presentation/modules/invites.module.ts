import { Module } from '@nestjs/common';
import { InvitesApplicationModule } from '@/application/services/invites/invites.module';
import { InvitesController } from '@/presentation/controllers/invites.controller';
import { InviteLoggerListener } from '@/infrastructure/listener/invite-logger.listener';

@Module({
  imports: [InvitesApplicationModule],
  controllers: [InvitesController],
  providers: [InviteLoggerListener],
})
export class InvitesPresentationModule {}

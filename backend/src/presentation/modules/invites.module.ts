import { Module } from '@nestjs/common';
import { InvitesApplicationModule } from '@/application/services/invites/invites.module';
import { InvitesController } from '@/presentation/controllers/invites.controller';

@Module({
  imports: [InvitesApplicationModule],
  controllers: [InvitesController],
})
export class InvitesPresentationModule {}

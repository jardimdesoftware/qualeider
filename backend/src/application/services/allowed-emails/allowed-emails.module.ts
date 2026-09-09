import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { AllowedEmailsService } from './allowed-emails.service';

@Module({
  imports: [InfrastructureModule],
  providers: [AllowedEmailsService],
  exports: [AllowedEmailsService],
})
export class AllowedEmailsApplicationModule {}

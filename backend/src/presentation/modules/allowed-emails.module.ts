import { Module } from '@nestjs/common';
import { AllowedEmailsApplicationModule } from '@/application/services/allowed-emails/allowed-emails.module';
import { AllowedEmailsController } from '@/presentation/controllers/allowed-emails.controller';

@Module({
  imports: [AllowedEmailsApplicationModule],
  controllers: [AllowedEmailsController],
})
export class AllowedEmailsPresentationModule {}

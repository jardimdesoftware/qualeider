import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { ActivityLogsApplicationModule } from '@/application/services/activity-logs/activity-logs.module';
import { AnimalsService } from './animals.service';

@Module({
  imports: [InfrastructureModule, ActivityLogsApplicationModule],
  providers: [AnimalsService],
  exports: [AnimalsService],
})
export class AnimalsApplicationModule {}

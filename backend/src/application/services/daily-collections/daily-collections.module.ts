import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { ActivityLogsApplicationModule } from '@/application/services/activity-logs/activity-logs.module';
import { DailyCollectionsService } from './daily-collections.service';

@Module({
  imports: [InfrastructureModule, ActivityLogsApplicationModule],
  providers: [DailyCollectionsService],
  exports: [DailyCollectionsService],
})
export class DailyCollectionsApplicationModule {}

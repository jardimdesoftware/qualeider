import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { ActivityLogService } from './activity-logs.service';

@Module({
  imports: [InfrastructureModule],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogsApplicationModule {}

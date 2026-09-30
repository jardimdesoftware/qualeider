import { Module } from '@nestjs/common';
import { ActivityLogsApplicationModule } from '@/application/services/activity-logs/activity-logs.module';
import { ActivityLogsController } from '@/presentation/controllers/activity-logs.controller';

@Module({
  imports: [ActivityLogsApplicationModule],
  controllers: [ActivityLogsController],
})
export class ActivityLogsPresentationModule {}

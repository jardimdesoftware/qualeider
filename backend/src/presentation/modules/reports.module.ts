import { Module } from '@nestjs/common';
import { ReportsApplicationModule } from '@/application/services/reports/reports.module';
import { ReportsController } from '@/presentation/controllers/reports.controller';

@Module({
  imports: [ReportsApplicationModule],
  controllers: [ReportsController],
})
export class ReportsPresentationModule {}

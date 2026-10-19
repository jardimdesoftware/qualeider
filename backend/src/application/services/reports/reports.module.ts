import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { ReportsService } from './reports.service';

@Module({
  imports: [InfrastructureModule],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsApplicationModule {}

import { Module } from '@nestjs/common';
import { DailyCollectionsService } from './daily-collections.service';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  providers: [DailyCollectionsService],
  exports: [DailyCollectionsService],
})
export class DailyCollectionsModule {}

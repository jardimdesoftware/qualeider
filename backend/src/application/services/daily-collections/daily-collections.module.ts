import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { DailyCollectionsService } from './daily-collections.service';

@Module({
  imports: [InfrastructureModule],
  providers: [DailyCollectionsService],
  exports: [DailyCollectionsService],
})
export class DailyCollectionsApplicationModule {}

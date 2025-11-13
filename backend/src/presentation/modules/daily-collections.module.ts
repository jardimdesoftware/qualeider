import { Module } from '@nestjs/common';
import { DailyCollectionsApplicationModule } from '@/application/services/daily-collections/daily-collections.module';
import { DailyCollectionsController } from '@/presentation/controllers/daily-collections.controller';

@Module({
  imports: [DailyCollectionsApplicationModule],
  controllers: [DailyCollectionsController],
})
export class DailyCollectionsPresentationModule {}

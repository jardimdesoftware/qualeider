import { Module } from '@nestjs/common';
import { DailyCollectionsModule as FeatureDailyCollectionsModule } from '../../daily-collections/daily-collections.module';
import { DailyCollectionsController } from '../controllers/daily-collections.controller';

@Module({
  imports: [FeatureDailyCollectionsModule],
  controllers: [DailyCollectionsController],
})
export class DailyCollectionsPresentationModule {}

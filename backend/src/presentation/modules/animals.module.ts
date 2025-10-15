import { Module } from '@nestjs/common';
import { AnimalsModule as FeatureAnimalsModule } from '../../animals/animals.module';
import { AnimalsController } from '../controllers/animals.controller';

@Module({
  imports: [FeatureAnimalsModule],
  controllers: [AnimalsController],
})
export class AnimalsPresentationModule {}

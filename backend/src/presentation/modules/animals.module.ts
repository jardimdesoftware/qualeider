import { Module } from '@nestjs/common';
import { AnimalsApplicationModule } from '@/application/services/animals/animals.module';
import { AnimalsController } from '../controllers/animals.controller';

@Module({
  imports: [AnimalsApplicationModule],
  controllers: [AnimalsController],
})
export class AnimalsPresentationModule {}

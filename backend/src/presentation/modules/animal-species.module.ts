import { Module } from '@nestjs/common';
import { AnimalSpeciesApplicationModule } from '@/application/services/animal-species/animal-species.module';
import { AnimalSpeciesController } from '@/presentation/controllers/animal-species.controller';

@Module({
  imports: [AnimalSpeciesApplicationModule],
  controllers: [AnimalSpeciesController],
})
export class AnimalSpeciesPresentationModule {}

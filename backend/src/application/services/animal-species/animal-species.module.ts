import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { AnimalSpeciesService } from './animal-species.service';

@Module({
  imports: [InfrastructureModule],
  providers: [AnimalSpeciesService],
  exports: [AnimalSpeciesService],
})
export class AnimalSpeciesApplicationModule {}

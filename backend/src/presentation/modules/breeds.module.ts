import { Module } from '@nestjs/common';
import { BreedsApplicationModule } from '@/application/services/breeds/breeds.module';
import { BreedsController } from '@/presentation/controllers/breeds.controller';

@Module({
  imports: [BreedsApplicationModule],
  controllers: [BreedsController],
})
export class BreedsPresentationModule {}

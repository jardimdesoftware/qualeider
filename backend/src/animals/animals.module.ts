import { Module } from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  providers: [AnimalsService],
  exports: [AnimalsService],
})
export class AnimalsModule {}

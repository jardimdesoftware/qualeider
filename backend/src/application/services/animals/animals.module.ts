import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { AnimalsService } from './animals.service';

@Module({
  imports: [InfrastructureModule],
  providers: [AnimalsService],
  exports: [AnimalsService],
})
export class AnimalsApplicationModule {}

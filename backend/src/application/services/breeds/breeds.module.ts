import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { BreedsService } from './breeds.service';

@Module({
  imports: [InfrastructureModule],
  providers: [BreedsService],
  exports: [BreedsService],
})
export class BreedsApplicationModule {}

import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { DestinationsService } from './destinations.service';

@Module({
  imports: [InfrastructureModule],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsApplicationModule {}

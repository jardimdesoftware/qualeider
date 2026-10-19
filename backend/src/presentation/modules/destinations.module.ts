import { Module } from '@nestjs/common';
import { DestinationsApplicationModule } from '@/application/services/destinations/destinations.module';
import { DestinationsController } from '@/presentation/controllers/destinations.controller';

@Module({
  imports: [DestinationsApplicationModule],
  controllers: [DestinationsController],
})
export class DestinationsPresentationModule {}

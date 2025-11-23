import { Module } from '@nestjs/common';
import { AssociationsService } from './associations.service';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [PrismaModule, InfrastructureModule],
  providers: [AssociationsService],
  exports: [AssociationsService],
})
export class AssociationsApplicationModule {}

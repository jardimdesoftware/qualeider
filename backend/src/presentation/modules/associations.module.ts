import { Module } from '@nestjs/common';
import { AssociationsController } from '@/presentation/controllers/associations/associations.controller';
import { AssociationsApplicationModule } from '@/application/services/associations/associations.module';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AssociationsApplicationModule],
  controllers: [AssociationsController],
})
export class AssociationsPresentationModule {}

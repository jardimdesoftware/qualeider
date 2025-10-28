import { Module } from '@nestjs/common';
import { AssociationsService } from './associations.service';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AssociationsService],
  exports: [AssociationsService],
})
export class AssociationsApplicationModule {}

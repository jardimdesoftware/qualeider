import { Module } from '@nestjs/common';
import { AssociationsController } from '@/presentation/controllers/associations.controller';
import { AssociationsApplicationModule } from '@/application/services/associations/associations.module';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { IsAssociationEmailUniqueConstraint } from '@/common/decorators/is-association-email-unique.decorator';
import { IsCnpjUniqueConstraint } from '@/common/decorators/is-cnpj-unique.decorator';

@Module({
  imports: [PrismaModule, AssociationsApplicationModule],
  controllers: [AssociationsController],
  providers: [
    IsAssociationEmailUniqueConstraint,
    IsCnpjUniqueConstraint,
  ],
})
export class AssociationsPresentationModule {}

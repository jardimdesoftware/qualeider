import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { AssociationEntity } from '@/domain/entities/association.entity';
import { handlePrismaError, isPrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { BusinessException } from '@/common/exceptions/business.exception';

@Injectable()
export class PrismaAssociationRepository implements IAssociationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<AssociationEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AssociationEntity> {
    try {
      const created = await this.prisma.association.create({
        data: {
          ...data,
          foundationDate: data.foundationDate ? new Date(data.foundationDate) : null, 
        },
      });
      return created as unknown as AssociationEntity;
    } catch (error) {
      // Tratamento específico para saber se foi CNPJ ou Email
      if (isPrismaError(error) && error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION) {
        const target = error.meta?.target as string[];
        
        if (target?.includes('cnpj')) {
          throw new BusinessException('CNPJ já cadastrado.');
        }
        if (target?.includes('email')) {
          throw new BusinessException('Email já cadastrado.');
        }
      }
      
      // Fallback genérico
      handlePrismaError(error);
    }
  }

  async findByEmail(email: string): Promise<AssociationEntity | null> {
    const association = await this.prisma.association.findUnique({
      where: { email },
    });
    return (association as any) ?? null;
  }

  async findByCnpj(cnpj: string): Promise<AssociationEntity | null> {
    const association = await this.prisma.association.findUnique({
      where: { cnpj },
    });
    return (association as any) ?? null;
  }
}

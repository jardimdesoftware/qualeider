import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IAllowedEmailRepository } from '@/domain/repositories/allowed-email.repository';
import { ID } from '@/domain/enums/enums';
import { AllowedEmailEntity } from '@/domain/entities/allowed-email.entity';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { AllowedEmailMapper } from '@/infrastructure/mappers/allowed-email.mapper';

@Injectable()
export class PrismaAllowedEmailRepository implements IAllowedEmailRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(email: string): Promise<AllowedEmailEntity> {
    try {
      const created = await this.prisma.allowedEmail.create({ data: { email } });
      return AllowedEmailMapper.toDomain(created);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Este email já está liberado.',
      });
    }
  }

  async findAll(): Promise<AllowedEmailEntity[]> {
    const items = await this.prisma.allowedEmail.findMany({ orderBy: { createdAt: 'desc' } });
    return items.map(AllowedEmailMapper.toDomain);
  }

  async findByEmail(email: string): Promise<AllowedEmailEntity | null> {
    const item = await this.prisma.allowedEmail.findUnique({ where: { email } });
    return item ? AllowedEmailMapper.toDomain(item) : null;
  }

  async delete(id: ID): Promise<void> {
    try {
      await this.prisma.allowedEmail.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Email liberado com ID ${id} não encontrado.`,
      });
    }
  }
}

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

  async create(email: string, adminId?: ID | null): Promise<AllowedEmailEntity> {
    try {
      const created = await this.prisma.allowedEmail.create({
        data: { email, adminId: adminId ?? null },
      });
      return AllowedEmailMapper.toDomain(created);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Este email já está liberado.',
      });
    }
  }

  async findAll(adminId?: ID): Promise<AllowedEmailEntity[]> {
    const items = await this.prisma.allowedEmail.findMany({
      where: adminId === undefined ? undefined : { OR: [{ adminId }, { adminId: null }] },
      orderBy: { createdAt: 'desc' },
    });
    return items.map(AllowedEmailMapper.toDomain);
  }

  async findById(id: ID): Promise<AllowedEmailEntity | null> {
    const item = await this.prisma.allowedEmail.findUnique({ where: { id } });
    return item ? AllowedEmailMapper.toDomain(item) : null;
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

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IDestinationRepository } from '@/domain/repositories/destination.repository';
import { ID } from '@/domain/enums/enums';
import { DestinationEntity } from '@/domain/entities/destination.entity';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { DestinationMapper } from '@/infrastructure/mappers/destination.mapper';

@Injectable()
export class PrismaDestinationRepository implements IDestinationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<DestinationEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DestinationEntity> {
    try {
      const created = await this.prisma.destination.create({
        data: {
          name: data.name,
          description: data.description ?? null,
        },
      });
      return DestinationMapper.toDomain(created);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Já existe um destino com este nome.',
      });
    }
  }

  async findAll(): Promise<DestinationEntity[]> {
    const destinations = await this.prisma.destination.findMany({
      orderBy: { name: 'asc' },
    });
    return destinations.map(DestinationMapper.toDomain);
  }

  async findById(id: ID): Promise<DestinationEntity | null> {
    const destination = await this.prisma.destination.findUnique({ where: { id } });
    if (!destination) return null;
    return DestinationMapper.toDomain(destination);
  }

  async findByName(name: string): Promise<DestinationEntity | null> {
    const destination = await this.prisma.destination.findUnique({ where: { name } });
    if (!destination) return null;
    return DestinationMapper.toDomain(destination);
  }

  async update(id: ID, data: Partial<DestinationEntity>): Promise<DestinationEntity> {
    try {
      const updated = await this.prisma.destination.update({
        where: { id },
        data: {
          name: data.name ?? undefined,
          description: data.description ?? undefined,
        },
      });
      return DestinationMapper.toDomain(updated);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Destino com ID ${id} não encontrado.`,
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Já existe um destino com este nome.',
      });
    }
  }

  async delete(id: ID): Promise<void> {
    try {
      await this.prisma.destination.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Destino com ID ${id} não encontrado.`,
        [PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED]:
          'Não é possível excluir este destino pois ele foi usado em coletas.',
      });
    }
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IBreedRepository } from '@/domain/repositories/breed.repository';
import { ID } from '@/domain/enums/enums';
import { BreedEntity } from '@/domain/entities/breed.entity';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { BreedMapper } from '@/infrastructure/mappers/breed.mapper';

@Injectable()
export class PrismaBreedRepository implements IBreedRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<BreedEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<BreedEntity> {
    try {
      const created = await this.prisma.breed.create({
        data: {
          name: data.name,
          description: data.description ?? null,
        },
      });
      return BreedMapper.toDomain(created);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Já existe uma raça com este nome.',
      });
    }
  }

  async findAll(): Promise<BreedEntity[]> {
    const breeds = await this.prisma.breed.findMany({
      orderBy: { name: 'asc' },
    });
    return breeds.map(BreedMapper.toDomain);
  }

  async findById(id: ID): Promise<BreedEntity | null> {
    const breed = await this.prisma.breed.findUnique({ where: { id } });
    if (!breed) return null;
    return BreedMapper.toDomain(breed);
  }

  async findByName(name: string): Promise<BreedEntity | null> {
    const breed = await this.prisma.breed.findUnique({ where: { name } });
    if (!breed) return null;
    return BreedMapper.toDomain(breed);
  }

  async update(id: ID, data: Partial<BreedEntity>): Promise<BreedEntity> {
    try {
      const updated = await this.prisma.breed.update({
        where: { id },
        data: {
          name: data.name ?? undefined,
          description: data.description ?? undefined,
        },
      });
      return BreedMapper.toDomain(updated);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Raça com ID ${id} não encontrada.`,
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Já existe uma raça com este nome.',
      });
    }
  }

  async delete(id: ID): Promise<void> {
    try {
      await this.prisma.breed.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Raça com ID ${id} não encontrada.`,
        [PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED]:
          'Não é possível excluir esta raça pois ela está associada a animais.',
      });
    }
  }
}

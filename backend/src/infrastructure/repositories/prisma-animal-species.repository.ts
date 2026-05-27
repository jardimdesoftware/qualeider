import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IAnimalSpeciesRepository } from '@/domain/repositories/animal-species.repository';
import { ID } from '@/domain/enums/enums';
import { AnimalSpeciesEntity } from '@/domain/entities/animal-species.entity';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { AnimalSpeciesMapper } from '@/infrastructure/mappers/animal-species.mapper';

@Injectable()
export class PrismaAnimalSpeciesRepository implements IAnimalSpeciesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<AnimalSpeciesEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnimalSpeciesEntity> {
    try {
      const created = await this.prisma.animalSpecies.create({
        data: { name: data.name, description: data.description ?? null },
      });
      return AnimalSpeciesMapper.toDomain(created);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Já existe um tipo com este nome.',
      });
    }
  }

  async findAll(): Promise<AnimalSpeciesEntity[]> {
    const items = await this.prisma.animalSpecies.findMany({ orderBy: { name: 'asc' } });
    return items.map(AnimalSpeciesMapper.toDomain);
  }

  async findById(id: ID): Promise<AnimalSpeciesEntity | null> {
    const item = await this.prisma.animalSpecies.findUnique({ where: { id } });
    return item ? AnimalSpeciesMapper.toDomain(item) : null;
  }

  async findByName(name: string): Promise<AnimalSpeciesEntity | null> {
    const item = await this.prisma.animalSpecies.findUnique({ where: { name } });
    return item ? AnimalSpeciesMapper.toDomain(item) : null;
  }

  async update(id: ID, data: Partial<AnimalSpeciesEntity>): Promise<AnimalSpeciesEntity> {
    try {
      const updated = await this.prisma.animalSpecies.update({
        where: { id },
        data: { name: data.name ?? undefined, description: data.description ?? undefined },
      });
      return AnimalSpeciesMapper.toDomain(updated);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Tipo com ID ${id} não encontrado.`,
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Já existe um tipo com este nome.',
      });
    }
  }

  async delete(id: ID): Promise<void> {
    try {
      await this.prisma.animalSpecies.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Tipo com ID ${id} não encontrado.`,
        [PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED]: 'Não é possível excluir este tipo pois ele está associado a animais.',
      });
    }
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IAnimalRepository, AnimalFindOneOptions } from '@/domain/repositories/animal.repository';
import { ID } from '@/domain/enums/enums';
import { AnimalEntity } from '@/domain/entities/animal.entity';
import { AnimalCriteria } from '@/domain/criteria/animal.criteria';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { AnimalMapper } from '@/infrastructure/mappers/animal.mapper';
import { Status as PrismaStatus } from '@prisma/client';

@Injectable()
export class PrismaAnimalRepository implements IAnimalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<AnimalEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<AnimalEntity> {
    try {
      const created = await this.prisma.animal.create({
        data: {
          name: data.name,
          animalType: data.animalType as any,
          breed: data.breed,
          age: data.age,
          userId: data.userId,
          status: PrismaStatus.Active,
        },
      });
      return AnimalMapper.toDomain(created);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED]: 'Produtor (User) não encontrado.',
      });
    }
  }

  async findAll(criteria: AnimalCriteria = {}): Promise<AnimalEntity[]> {
    const where: Prisma.AnimalWhereInput = {};

    where.status = criteria.status !== undefined ? (criteria.status as PrismaStatus) : PrismaStatus.Active;

    if (criteria.userId) {
      where.userId = criteria.userId;
    }

    if (criteria.associationId) {
      where.user = {
        associationId: criteria.associationId,
      };
    }

    if (criteria.animalType) {
      where.animalType = criteria.animalType as any;
    }

    const include: Prisma.AnimalInclude = {};
    if (criteria.includeUser) {
      include.user = true;
    }

    const animals = await this.prisma.animal.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return animals.map(AnimalMapper.toDomain);
  }

  async findById(id: ID, options?: AnimalFindOneOptions): Promise<AnimalEntity | null> {
    const include: Prisma.AnimalInclude = {};
    
    if (options?.includeUser) {
      include.user = true;
    }

    const rawAnimal = await this.prisma.animal.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    });
    
    if (!rawAnimal) return null;

    return AnimalMapper.toDomain(rawAnimal);
  }

  async update(id: ID, data: Partial<AnimalEntity>): Promise<AnimalEntity> {
    try {
      const updated = await this.prisma.animal.update({
        where: { id },
        data: {
          name: data.name ?? undefined,
          animalType: (data.animalType as any) ?? undefined,
          breed: data.breed ?? undefined,
          age: data.age ?? undefined,
          status: (data.status as unknown as PrismaStatus) ?? undefined,
        },
      });
      return AnimalMapper.toDomain(updated);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Animal com ID ${id} não encontrado.`,
      });
    }
  }

  async softDelete(id: ID): Promise<AnimalEntity> {
    try {
      const deactivated = await this.prisma.animal.update({
        where: { id },
        data: { status: PrismaStatus.Inactive },
      });
      return AnimalMapper.toDomain(deactivated);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Animal com ID ${id} não encontrado para remoção.`,
      });
    }
  }
}
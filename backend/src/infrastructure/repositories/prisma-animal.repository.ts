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
import { PaginatedResult, normalizePaginationParams, createPaginatedResult } from '@/domain/common/pagination.interface';

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
          animalType: data.animalType ?? null,
          animalSpeciesId: data.animalSpeciesId ?? null,
          breed: data.breed ?? null,
          breedId: data.breedId ?? null,
          age: data.age,
          userId: data.userId,
          status: PrismaStatus.Active,
        },
        include: { animalSpecies: true },
      });
      return AnimalMapper.toDomain(created);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED]: 'Produtor (User) não encontrado.',
      });
    }
  }

  async findAll(criteria: AnimalCriteria = {}): Promise<PaginatedResult<AnimalEntity>> {
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
      where.animalType = criteria.animalType;
    }

    const include: Prisma.AnimalInclude = { animalSpecies: true };
    if (criteria.includeUser) {
      include.user = true;
    }

    // Normalizar parâmetros de paginação
    const { page, limit, skip } = normalizePaginationParams(criteria);

    // Executar count e query em paralelo
    const [total, animals] = await Promise.all([
      this.prisma.animal.count({ where }),
      this.prisma.animal.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const data = animals.map(AnimalMapper.toDomain);

    return createPaginatedResult(data, total, page, limit);
  }

  async findById(id: ID, options?: AnimalFindOneOptions): Promise<AnimalEntity | null> {
    const include: Prisma.AnimalInclude = { animalSpecies: true };

    if (options?.includeUser) {
      include.user = true;
    }

    const rawAnimal = await this.prisma.animal.findUnique({
      where: { id },
      include,
    });
    
    if (!rawAnimal) return null;

    return AnimalMapper.toDomain(rawAnimal);
  }

  async findByIds(ids: ID[], options?: AnimalFindOneOptions): Promise<AnimalEntity[]> {
    const include: Prisma.AnimalInclude = {};
    
    if (options?.includeUser) {
      include.user = true;
    }

    const animals = await this.prisma.animal.findMany({
      where: { id: { in: ids } },
      include: Object.keys(include).length > 0 ? include : undefined,
    });

    return animals.map(AnimalMapper.toDomain);
  }

  async update(id: ID, data: Partial<AnimalEntity>): Promise<AnimalEntity> {
    try {
      const updated = await this.prisma.animal.update({
        where: { id },
        data: {
          name: data.name ?? undefined,
          animalType: data.animalType ?? undefined,
          animalSpeciesId: data.animalSpeciesId ?? undefined,
          breed: data.breed ?? undefined,
          breedId: data.breedId ?? undefined,
          age: data.age ?? undefined,
          status: (data.status as unknown as PrismaStatus) ?? undefined,
        },
        include: { animalSpecies: true },
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
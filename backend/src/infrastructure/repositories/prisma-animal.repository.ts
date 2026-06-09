import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IAnimalRepository, AnimalFindOneOptions } from '@/domain/repositories/animal.repository';
import { ID } from '@/domain/enums/enums';
import { AnimalEntity } from '@/domain/entities/animal.entity';
import { AnimalCriteria } from '@/domain/criteria/animal.criteria';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { AnimalMapper } from '@/infrastructure/mappers/animal.mapper';
import { Status as PrismaStatus } from '@prisma/client';
import { PaginatedResult, normalizePaginationParams, createPaginatedResult } from '@/domain/common/pagination.interface';

const ANIMAL_INCLUDE: any = {
  animalSpecies: true,
  mother: true,
  father: true,
};

@Injectable()
export class PrismaAnimalRepository implements IAnimalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<AnimalEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<AnimalEntity> {
    try {
      const created = await (this.prisma.animal.create as any)({
        data: {
          tagNumber: data.tagNumber ?? null,
          name: data.name ?? null,
          animalType: data.animalType ?? null,
          animalSpeciesId: data.animalSpeciesId ?? null,
          breed: data.breed ?? null,
          breedId: data.breedId ?? null,
          age: data.age,
          userId: data.userId,
          status: PrismaStatus.Active,
          motherId: data.motherId ?? null,
          motherCode: data.motherCode ?? null,
          fatherId: data.fatherId ?? null,
          fatherCode: data.fatherCode ?? null,
        },
        include: ANIMAL_INCLUDE,
      });
      return AnimalMapper.toDomain(created);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED]: 'Produtor (User) nao encontrado.',
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Ja existe um animal com esse numero de identificacao para este produtor.',
      });
    }
  }

  async findAll(criteria: AnimalCriteria = {}): Promise<PaginatedResult<AnimalEntity>> {
    const where: any = {};

    where.status = criteria.status !== undefined ? criteria.status : PrismaStatus.Active;

    if (criteria.userId) {
      where.userId = criteria.userId;
    }

    if (criteria.associationId) {
      where.user = { associationId: criteria.associationId };
    }

    if (criteria.animalType) {
      where.animalType = criteria.animalType;
    }

    if (criteria.tagNumber) {
      where.tagNumber = { contains: criteria.tagNumber, mode: 'insensitive' };
    }

    const include: any = { ...ANIMAL_INCLUDE };
    if (criteria.includeUser) {
      include.user = true;
    }

    const { page, limit, skip } = normalizePaginationParams(criteria);

    const [total, animals] = await Promise.all([
      this.prisma.animal.count({ where }),
      (this.prisma.animal.findMany as any)({
        where,
        include,
        orderBy: { tagNumber: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    const data = animals.map(AnimalMapper.toDomain);

    return createPaginatedResult(data, total, page, limit);
  }

  async findById(id: ID, options?: AnimalFindOneOptions): Promise<AnimalEntity | null> {
    const include: any = { ...ANIMAL_INCLUDE };

    if (options?.includeUser) {
      include.user = true;
    }

    const rawAnimal = await (this.prisma.animal.findUnique as any)({
      where: { id },
      include,
    });

    if (!rawAnimal) return null;

    return AnimalMapper.toDomain(rawAnimal);
  }

  async findByIds(ids: ID[], options?: AnimalFindOneOptions): Promise<AnimalEntity[]> {
    const include: any = { ...ANIMAL_INCLUDE };

    if (options?.includeUser) {
      include.user = true;
    }

    const animals = await (this.prisma.animal.findMany as any)({
      where: { id: { in: ids } },
      include,
    });

    return animals.map(AnimalMapper.toDomain);
  }

  async findByTagNumber(userId: ID, tagNumber: string): Promise<AnimalEntity | null> {
    const raw = await (this.prisma.animal.findUnique as any)({
      where: {
        userId_tagNumber: { userId, tagNumber },
      },
      include: ANIMAL_INCLUDE,
    });

    if (!raw) return null;
    return AnimalMapper.toDomain(raw);
  }

  /**
   * Busca animais do mesmo usuario que tem motherCode OU fatherCode
   * igual ao tagNumber informado (para reconciliacao automatica de parentesco).
   */
  async findPendingByParentCode(userId: ID, tagNumber: string): Promise<AnimalEntity[]> {
    const animals = await (this.prisma.animal.findMany as any)({
      where: {
        userId,
        OR: [
          { motherCode: tagNumber, motherId: null },
          { fatherCode: tagNumber, fatherId: null },
        ],
      },
      include: ANIMAL_INCLUDE,
    });

    return animals.map(AnimalMapper.toDomain);
  }

  async update(id: ID, data: Partial<AnimalEntity>): Promise<AnimalEntity> {
    try {
      const updated = await (this.prisma.animal.update as any)({
        where: { id },
        data: {
          tagNumber: data.tagNumber ?? undefined,
          name: data.name ?? undefined,
          animalType: data.animalType ?? undefined,
          animalSpeciesId: data.animalSpeciesId ?? undefined,
          breed: data.breed ?? undefined,
          breedId: data.breedId ?? undefined,
          age: data.age ?? undefined,
          status: data.status ?? undefined,
          motherId: data.motherId ?? undefined,
          motherCode: data.motherCode ?? undefined,
          fatherId: data.fatherId ?? undefined,
          fatherCode: data.fatherCode ?? undefined,
        },
        include: ANIMAL_INCLUDE,
      });
      return AnimalMapper.toDomain(updated);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Animal com ID ${id} nao encontrado.`,
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Ja existe um animal com esse numero de identificacao para este produtor.',
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
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Animal com ID ${id} nao encontrado para remocao.`,
      });
    }
  }
}

import { Injectable } from '@nestjs/common';
import { MilkingPlace, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IDailyCollectionRepository, DailyCollectionFindOneOptions, CreateDailyCollectionData } from '@/domain/repositories/daily-collection.repository';
import { ID } from '@/domain/enums/enums';
import { DailyCollectionEntity, DailyCollectionItem } from '@/domain/entities/daily-collection.entity';
import { DailyCollectionCriteria } from '@/domain/criteria/daily-collection.criteria';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { DailyCollectionMapper } from '@/infrastructure/mappers/daily-collection.mapper';
import { PaginatedResult, normalizePaginationParams, createPaginatedResult } from '@/domain/common/pagination.interface';

@Injectable()
export class PrismaDailyCollectionRepository implements IDailyCollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDailyCollectionData): Promise<DailyCollectionEntity> {
    try {
      const created = await this.prisma.dailyCollection.create({
        data: {
          userId: data.userId,
          quantity: data.quantity,
          collectionDate: data.collectionDate,
          numAnimals: data.numAnimals,
          numOrdens: data.numOrdens,
          rationProvided: data.rationProvided,
          numLactation: data.numLactation,
          milkingPlace: data.milkingPlace as unknown as MilkingPlace,
          technicalAssistance: data.technicalAssistance,
          items: data.items ? {
            create: data.items.map((item) => ({
              animalId: item.animalId,
              quantity: item.quantity,
            })),
          } : undefined,
        },
        include: { items: true },
      });
      return DailyCollectionMapper.toDomain(created);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED]: 'Produtor (User) inválido ou não encontrado.',
      });
    }
  }

  async findAll(criteria: DailyCollectionCriteria = {}): Promise<PaginatedResult<DailyCollectionEntity>> {
    const where: Prisma.DailyCollectionWhereInput = {};

    if (criteria.userId) {
      where.userId = criteria.userId;
    }

    if (criteria.associationId) {
      where.user = {
        associationId: criteria.associationId,
      };
    }

    if (criteria.dateRange) {
      where.collectionDate = {
        gte: criteria.dateRange.start,
        lte: criteria.dateRange.end,
      };
    }

    const include: Prisma.DailyCollectionInclude = { 
      items: {
        include: { animal: true }
      } 
    };
    if (criteria.includeUser) {
      include.user = true;
    }

    // Normalizar parâmetros de paginação
    const { page, limit, skip } = normalizePaginationParams(criteria);

    // Executar count e query em paralelo
    const [total, list] = await Promise.all([
      this.prisma.dailyCollection.count({ where }),
      this.prisma.dailyCollection.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        orderBy: { collectionDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const data = list.map(DailyCollectionMapper.toDomain);

    return createPaginatedResult(data, total, page, limit);
  }

  async findById(id: ID, options?: DailyCollectionFindOneOptions): Promise<DailyCollectionEntity | null> {
    const include: Prisma.DailyCollectionInclude = { 
      items: {
        include: { animal: true }
      } 
    };
    
    if (options?.includeUser) {
      include.user = true;
    }

    const rawDailyCollection = await this.prisma.dailyCollection.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    });
    
    if (!rawDailyCollection) return null;

    return DailyCollectionMapper.toDomain(rawDailyCollection);
  }

  async update(
    id: ID,
    data: Partial<DailyCollectionEntity>,
  ): Promise<DailyCollectionEntity> {
    try {
      const updated = await this.prisma.dailyCollection.update({
        where: { id },
        data: {
          quantity: data.quantity ?? undefined,
          collectionDate: data.collectionDate ?? undefined,
          numAnimals: data.numAnimals ?? undefined,
          numOrdens: data.numOrdens ?? undefined,
          rationProvided: data.rationProvided ?? undefined,
          numLactation: data.numLactation ?? undefined,
          milkingPlace: (data.milkingPlace as any) ?? undefined,
          technicalAssistance: data.technicalAssistance ?? undefined,
        },
      });
      return DailyCollectionMapper.toDomain(updated);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Coleta diária com ID ${id} não encontrada para atualização.`,
      });
    }
  }

  async updateItems(
    collectionId: ID,
    items: Omit<DailyCollectionItem, 'id' | 'dailyCollectionId'>[],
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.dailyCollectionItem.deleteMany({
          where: { dailyCollectionId: collectionId },
        });

        await tx.dailyCollectionItem.createMany({
          data: items.map((item) => ({
            dailyCollectionId: collectionId,
            animalId: item.animalId,
            quantity: item.quantity,
          })),
        });
      });
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Coleta diária com ID ${collectionId} não encontrada.`,
      });
    }
  }

  async delete(id: ID): Promise<void> {
    try {
      await this.prisma.dailyCollection.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Coleta diária com ID ${id} não encontrada para remoção.`,
      });
    }
  }

  async countItemsByAnimalId(animalId: ID): Promise<number> {
    return this.prisma.dailyCollectionItem.count({
      where: { animalId },
    });
  }
}
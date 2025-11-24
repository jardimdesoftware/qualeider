import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IDailyCollectionRepository, DailyCollectionFindOneOptions } from '@/domain/repositories/daily-collection.repository';
import { ID } from '@/domain/enums/enums';
import { DailyCollectionEntity } from '@/domain/entities/daily-collection.entity';
import { DailyCollectionCriteria } from '@/domain/criteria/daily-collection.criteria';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { DailyCollectionMapper } from '@/infrastructure/mappers/daily-collection.mapper';

@Injectable()
export class PrismaDailyCollectionRepository implements IDailyCollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<DailyCollectionEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyCollectionEntity> {
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
          milkingPlace: data.milkingPlace as any,
          technicalAssistance: data.technicalAssistance,
        },
      });
      return DailyCollectionMapper.toDomain(created);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED]: 'Produtor (User) inválido ou não encontrado.',
      });
    }
  }

  async findAll(criteria: DailyCollectionCriteria = {}): Promise<DailyCollectionEntity[]> {
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

    const include: Prisma.DailyCollectionInclude = {};
    if (criteria.includeUser) {
      include.user = true;
    }

    const list = await this.prisma.dailyCollection.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { collectionDate: 'desc' },
    });

    return list.map(DailyCollectionMapper.toDomain);
  }

  async findById(id: ID, options?: DailyCollectionFindOneOptions): Promise<DailyCollectionEntity | null> {
    const include: Prisma.DailyCollectionInclude = {};
    
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

  async checkIfUserAlreadySubmitted(userId: ID): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.prisma.dailyCollection.findFirst({
      where: {
        userId,
        collectionDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return !!existing;
  }
}
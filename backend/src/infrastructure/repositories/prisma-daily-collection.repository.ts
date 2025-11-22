import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IDailyCollectionRepository } from '@/domain/repositories/daily-collection.repository';
import { DailyCollectionEntity } from '@/domain/entities/daily-collection.entity';
import { ID } from '@/domain/enums/enums';
import { DailyCollectionCriteria } from '@/domain/criteria/daily-collection.criteria';

@Injectable()
export class PrismaDailyCollectionRepository
  implements IDailyCollectionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<DailyCollectionEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DailyCollectionEntity> {
    const created = await this.prisma.dailyCollection.create({
      data: {
        quantity: data.quantity,
        collectionDate: data.collectionDate,
        userId: data.userId,
        numAnimals: data.numAnimals,
        numOrdens: data.numOrdens,
        rationProvided: data.rationProvided,
        numLactation: data.numLactation,
        milkingPlace: data.milkingPlace as any,
        technicalAssistance: data.technicalAssistance,
      },
    });
    return created as any;
  }

  async findAll(criteria?: DailyCollectionCriteria): Promise<DailyCollectionEntity[]> {
    const where: any = {};

    if (criteria?.userId) {
      where.userId = criteria.userId;
    }

    if (criteria?.associationId) {
      where.user = {
        associationId: criteria.associationId,
      };
    }

    if (criteria?.dateRange) {
      where.collectionDate = {
        gte: criteria.dateRange.start,
        lte: criteria.dateRange.end,
      };
    }

    const list = await this.prisma.dailyCollection.findMany({ where });
    return list as any;
  }

  async findById(id: ID): Promise<DailyCollectionEntity | null> {
    const found = await this.prisma.dailyCollection.findUnique({
      where: { id },
    });
    return (found as any) ?? null;
  }

  async update(
    id: ID,
    data: Partial<DailyCollectionEntity>,
  ): Promise<DailyCollectionEntity> {
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
    return updated as any;
  }

  async delete(id: ID): Promise<void> {
    await this.prisma.dailyCollection.delete({ where: { id } });
  }

  async checkIfUserAlreadySubmitted(userId: ID): Promise<boolean> {
    const submission = await this.prisma.dailyCollection.findFirst({
      where: { userId },
    });
    return !!submission;
  }

  async findAllByUserId(userId: ID): Promise<DailyCollectionEntity[]> {
    const list = await this.prisma.dailyCollection.findMany({
      where: { userId },
    });
    return list as any;
  }
}

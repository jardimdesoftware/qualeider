import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { Prisma } from '@prisma/client';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

@Injectable()
export class DailyCollectionsService {
  private readonly logger = new Logger(DailyCollectionsService.name);

  constructor(private prisma: PrismaService) {}

  private async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new EntityNotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }
    return user;
  }

  async create(createDailyCollectionDto: CreateDailyCollectionDto) {
    await this.validateUser(createDailyCollectionDto.userId);

    const dailyCollection = await this.prisma.dailyCollection.create({
      data: createDailyCollectionDto,
    });

    this.logger.log(
      `Formulário criado para o usuário ID ${createDailyCollectionDto.userId}`,
    );

    return dailyCollection;
  }

  async findAll(associationId?: number) {
    const where: Prisma.DailyCollectionWhereInput = {};

    if (associationId !== undefined) {
      where.user = {
        associationId: associationId,
      };
    }

    return this.prisma.dailyCollection.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            associationId: true,
          },
        },
      },
      orderBy: {
        collectionDate: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const dailyCollection = await this.prisma.dailyCollection.findUnique({
      where: { id },
    });

    if (!dailyCollection) {
      throw new EntityNotFoundException(`Coleta diária com ID ${id} não encontrada.`);
    }
    return dailyCollection;
  }

  async update(id: number, updateDailyCollectionDto: UpdateDailyCollectionDto) {
    return this.prisma.dailyCollection.update({
      where: { id },
      data: updateDailyCollectionDto,
    });
  }

  async remove(id: number) {
    return this.prisma.dailyCollection.delete({
      where: { id },
    });
  }

  async findAllByUserId(userId: number) {
    const dailyCollections = await this.prisma.dailyCollection.findMany({
      where: { userId },
      orderBy: { collectionDate: 'desc' },
    });

    return dailyCollections;
  }
}
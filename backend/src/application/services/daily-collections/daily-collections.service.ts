import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DailyCollectionsService {
  private readonly logger = new Logger(DailyCollectionsService.name);

  constructor(private prisma: PrismaService) {}

  private async getActiveUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }
    return user;
  }

  async create(createDailyCollectionDto: CreateDailyCollectionDto) {
    await this.getActiveUser(createDailyCollectionDto.userId);

    const dailyCollection = await this.prisma.dailyCollection.create({
      data: { ...createDailyCollectionDto },
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

    const dailyCollections = await this.prisma.dailyCollection.findMany({
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
    return dailyCollections;
  }

  async checkIfUserAlreadySubmitted(userId: number) {
    const submission = await this.prisma.dailyCollection.findFirst({
      where: { userId },
    });
    return !!submission;
  }

  async findOne(id: number) {
    const dailyCollection = await this.prisma.dailyCollection.findUnique({
      where: { id },
    });

    if (!dailyCollection) {
      throw new NotFoundException(`Coleta diária com ID ${id} não encontrada.`);
    }
    return dailyCollection;
  }

  async update(id: number, updateDailyCollectionDto: UpdateDailyCollectionDto) {
    const updated = await this.prisma.dailyCollection.update({
      where: { id },
      data: updateDailyCollectionDto,
    });

    return updated;
  }

  async remove(id: number) {
    const deleted = await this.prisma.dailyCollection.delete({
      where: { id },
    });
    return deleted;
  }

  async findAllByUserId(userId: number) {
    const dailyCollections = await this.prisma.dailyCollection.findMany({
      where: { userId },
    });

    if (!dailyCollections || dailyCollections.length === 0) {
      throw new NotFoundException(
        `Nenhum formulário encontrado para o usuário com ID ${userId}.`,
      );
    }
    return dailyCollections;
  }
}

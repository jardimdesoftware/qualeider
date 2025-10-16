import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class DailyCollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(createDailyCollectionDto: CreateDailyCollectionDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: createDailyCollectionDto.userId },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com ID ${createDailyCollectionDto.userId} não encontrado.`,
        );
      }

      const dailyCollection = await this.prisma.dailyCollection.create({
        data: { ...createDailyCollectionDto },
      });

      return {
        message: 'Formulário respondido com sucesso.',
        data: dailyCollection,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error(`Erro ao criar formulário: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll() {
    try {
      const dailyCollections = await this.prisma.dailyCollection.findMany();
      return dailyCollections;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error(`Erro ao buscar formulários: ${error.message}`);
      }
      throw error;
    }
  }

  async checkIfUserAlreadySubmitted(userId: number) {
    try {
      const submission = await this.prisma.dailyCollection.findFirst({
        where: { userId },
      });
      return { alreadySubmitted: !!submission };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error(`Erro ao verificar submissão: ${error.message}`);
      }
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const dailyCollection = await this.prisma.dailyCollection.findUnique({
        where: { id },
      });
      if (!dailyCollection) {
        throw new NotFoundException(
          `Coleta diária com ID ${id} não encontrada.`,
        );
      }
      return { data: dailyCollection };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error(`Erro ao buscar coleta diária: ${error.message}`);
      }
      throw error;
    }
  }

  async update(id: number, updateDailyCollectionDto: UpdateDailyCollectionDto) {
    try {
      const existing = await this.prisma.dailyCollection.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException(
          `Coleta diária com ID ${id} não encontrada.`,
        );
      }
      const updated = await this.prisma.dailyCollection.update({
        where: { id },
        data: updateDailyCollectionDto,
      });
      return {
        message: `Coleta diária com ID ${id} atualizada com sucesso.`,
        data: updated,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Coleta diária com ID ${id} não encontrada.`,
          );
        }
        throw new Error(`Erro ao atualizar coleta diária: ${error.message}`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const deleted = await this.prisma.dailyCollection.delete({
        where: { id },
      });
      return {
        message: `Coleta diária com ID ${id} excluída com sucesso.`,
        data: deleted,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Coleta diária com ID ${id} não encontrada.`,
          );
        }
        throw new Error(`Erro ao excluir coleta diária: ${error.message}`);
      }
      throw error;
    }
  }

  async findAllByUserId(userId: number) {
    try {
      const dailyCollections = await this.prisma.dailyCollection.findMany({
        where: { userId },
      });
      if (!dailyCollections || dailyCollections.length === 0) {
        throw new NotFoundException(
          `Nenhum formulário encontrado para o usuário com ID ${userId}.`,
        );
      }
      return { data: dailyCollections };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error(`Erro ao buscar formulários: ${error.message}`);
      }
      throw error;
    }
  }
}

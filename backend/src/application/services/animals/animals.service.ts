import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { Prisma } from '@prisma/client';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

@Injectable()
export class AnimalsService {
  private readonly logger = new Logger(AnimalsService.name);

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

  async create(createAnimalDto: CreateAnimalDto) {
    await this.validateUser(createAnimalDto.userId);
    const animal = await this.prisma.animal.create({
      data: createAnimalDto,
    });

    this.logger.log(
      `Animal cadastrado para usuário ID ${createAnimalDto.userId}`,
    );

    return animal;
  }

  async findAll(associationId?: number) {
    const where: Prisma.AnimalWhereInput = { status: 'Active' };

    if (associationId !== undefined) {
      where.user = {
        associationId: associationId,
      };
    }

    return this.prisma.animal.findMany({
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
    });
  }

  async findOne(id: number) {
    const animal = await this.prisma.animal.findUnique({ where: { id } });

    if (!animal) {
      throw new EntityNotFoundException(`Animal com ID ${id} não encontrado.`);
    }
    return animal;
  }

  async update(id: number, updateAnimalDto: UpdateAnimalDto) {
    return this.prisma.animal.update({
      where: { id },
      data: updateAnimalDto,
    });
  }

  async remove(id: number) {
    return this.prisma.animal.update({
      where: { id },
      data: { status: 'Inactive' },
    });
  }

  async findAllByUserId(userId: number) {
    const animals = await this.prisma.animal.findMany({
      where: { userId, status: 'Active' },
    });
    return animals;
  }
}
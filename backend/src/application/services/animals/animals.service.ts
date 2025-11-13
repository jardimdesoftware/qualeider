import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnimalsService {
  private readonly logger = new Logger(AnimalsService.name);

  constructor(private prisma: PrismaService) {}

  private async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado.`);
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

    const animals = await this.prisma.animal.findMany({
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
    return animals;
  }

  async findOne(id: number) {
    const animal = await this.prisma.animal.findUnique({ where: { id } });

    if (!animal) {
      throw new NotFoundException(`Animal com ID ${id} não encontrado.`);
    }
    return animal;
  }

  async update(id: number, updateAnimalDto: UpdateAnimalDto) {
    const updatedAnimal = await this.prisma.animal.update({
      where: { id },
      data: updateAnimalDto,
    });
    return updatedAnimal;
  }

  async remove(id: number) {
    const deactivated = await this.prisma.animal.update({
      where: { id },
      data: { status: 'Inactive' },
    });
    return deactivated;
  }

  async findAllByUserId(userId: number) {
    const animals = await this.prisma.animal.findMany({
      where: { userId, status: 'Active' },
    });
    if (!animals || animals.length === 0) {
      throw new NotFoundException(
        `Nenhum animal encontrado para o usuário com ID ${userId}.`,
      );
    }
    return animals;
  }
}

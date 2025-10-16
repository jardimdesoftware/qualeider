import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AnimalsService {
  constructor(private prisma: PrismaService) {}

  async create(createAnimalDto: CreateAnimalDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: createAnimalDto.userId },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com ID ${createAnimalDto.userId} não encontrado.`,
        );
      }

      const animal = await this.prisma.animal.create({
        data: createAnimalDto,
      });

      return { message: 'Animal cadastrado com sucesso.', data: animal };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error(`Erro ao criar animal: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll() {
    try {
      const animals = await this.prisma.animal.findMany({
        where: { status: 'Active' },
      });
      return { data: animals };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error(`Erro ao buscar animais: ${error.message}`);
      }
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const animal = await this.prisma.animal.findUnique({ where: { id } });
      if (!animal) {
        throw new NotFoundException(`Animal com ID ${id} não encontrado.`);
      }
      return { data: animal };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error(`Erro ao buscar animal: ${error.message}`);
      }
      throw error;
    }
  }

  async update(id: number, updateAnimalDto: UpdateAnimalDto) {
    const animal = await this.prisma.animal.findUnique({
      where: { id, status: 'Active' },
    });
    if (!animal) {
      throw new NotFoundException(
        `Animal com ID ${id} não encontrado ou está inativo.`,
      );
    }
    const updatedAnimal = await this.prisma.animal.update({
      where: { id },
      data: updateAnimalDto,
    });
    return {
      message: `Animal com ID ${id} foi atualizado com sucesso.`,
      data: updatedAnimal,
    };
  }

  async remove(id: number) {
    const animal = await this.prisma.animal.findUnique({
      where: { id, status: 'Active' },
    });
    if (!animal) {
      throw new NotFoundException(
        `Animal com ID ${id} não encontrado ou já está inativo.`,
      );
    }
    await this.prisma.animal.update({
      where: { id },
      data: { status: 'Inactive' },
    });
    return { message: `Animal com ID ${id} foi desativado com sucesso.` };
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

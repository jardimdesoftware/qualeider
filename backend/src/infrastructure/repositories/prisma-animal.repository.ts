import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IAnimalRepository } from '@/domain/repositories/animal.repository';
import { AnimalEntity } from '@/domain/entities/animal.entity';
import { ID, Status } from '@/domain/enums/enums';
import { AnimalCriteria } from '@/domain/criteria/animal.criteria';

@Injectable()
export class PrismaAnimalRepository implements IAnimalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<AnimalEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: string;
    },
  ): Promise<AnimalEntity> {
    const created = await this.prisma.animal.create({
      data: {
        name: data.name ?? null,
        animalType: data.animalType as any,
        breed: data.breed,
        age: data.age,
        userId: data.userId,
        status: (data as any).status ?? Status.Active,
      },
    });
    return created as any;
  }

  async findAll(criteria?: AnimalCriteria): Promise<AnimalEntity[]> {
    const where: any = {};

    if (criteria?.status) {
      where.status = criteria.status;
    }

    if (criteria?.userId) {
      where.userId = criteria.userId;
    }

    if (criteria?.associationId) {
      where.user = {
        associationId: criteria.associationId,
      };
    }

    const animals = await this.prisma.animal.findMany({
      where,
    });
    return animals as any;
  }

  async findById(id: ID): Promise<AnimalEntity | null> {
    const animal = await this.prisma.animal.findUnique({ where: { id } });
    return (animal as any) ?? null;
  }

  async update(id: ID, data: Partial<AnimalEntity>): Promise<AnimalEntity> {
    const updated = await this.prisma.animal.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        animalType: (data.animalType as any) ?? undefined,
        breed: data.breed ?? undefined,
        age: data.age ?? undefined,
        status: (data.status as any) ?? undefined,
      },
    });
    return updated as any;
  }

  async softDelete(id: ID): Promise<void> {
    await this.prisma.animal.update({
      where: { id },
      data: { status: Status.Inactive },
    });
  }

  async findAllByUserId(userId: ID): Promise<AnimalEntity[]> {
    const animals = await this.prisma.animal.findMany({
      where: { userId, status: Status.Active },
    });
    return animals as any;
  }
}

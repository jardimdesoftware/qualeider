import { Breed as PrismaBreed } from '@prisma/client';
import { BreedEntity } from '@/domain/entities/breed.entity';

export class BreedMapper {
  static toDomain(raw: PrismaBreed): BreedEntity {
    return new BreedEntity({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPrisma(breed: BreedEntity): PrismaBreed {
    return {
      id: breed.id,
      name: breed.name,
      description: breed.description ?? null,
      createdAt: breed.createdAt,
      updatedAt: breed.updatedAt,
    } as PrismaBreed;
  }
}

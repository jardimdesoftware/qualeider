import { AnimalSpecies as PrismaAnimalSpecies } from '@prisma/client';
import { AnimalSpeciesEntity } from '@/domain/entities/animal-species.entity';

export class AnimalSpeciesMapper {
  static toDomain(raw: PrismaAnimalSpecies): AnimalSpeciesEntity {
    return new AnimalSpeciesEntity({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}

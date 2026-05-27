import { Animal as PrismaAnimal } from "@prisma/client";
import { AnimalEntity } from "@/domain/entities/animal.entity";
import { AnimalType, Status } from "@/domain/enums/enums";

export class AnimalMapper {
    static toDomain(raw: PrismaAnimal & { animalSpecies?: { id: number; name: string; description?: string | null } | null }): AnimalEntity {
        return new AnimalEntity({
            id: raw.id,
            name: raw.name,
            animalType: raw.animalType as AnimalType ?? null,
            animalSpeciesId: raw.animalSpeciesId ?? null,
            breed: raw.breed,
            breedId: raw.breedId,
            age: raw.age,
            userId: raw.userId,
            status: raw.status as Status,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }

    static toPrisma(animal: AnimalEntity): PrismaAnimal {
        return {
            id: animal.id,
            name: animal.name ?? null,
            animalType: animal.animalType ?? null,
            animalSpeciesId: animal.animalSpeciesId ?? null,
            breed: animal.breed ?? null,
            breedId: animal.breedId ?? null,
            age: animal.age,
            userId: animal.userId,
            status: animal.status,
            createdAt: animal.createdAt,
            updatedAt: animal.updatedAt,
        } as PrismaAnimal;
    }
}

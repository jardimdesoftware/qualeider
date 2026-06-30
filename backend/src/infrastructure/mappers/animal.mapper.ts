import { AnimalEntity } from "@/domain/entities/animal.entity";
import { AnimalType, Status } from "@/domain/enums/enums";

type PrismaAnimalRaw = any;

export class AnimalMapper {
    static toDomain(raw: PrismaAnimalRaw): AnimalEntity {
        return new AnimalEntity({
            id: raw.id,
            tagNumber: raw.tagNumber ?? null,
            name: raw.name ?? null,
            animalType: raw.animalType as AnimalType ?? null,
            animalSpeciesId: raw.animalSpeciesId ?? null,
            animalSpecies: raw.animalSpecies ? {
                id: raw.animalSpecies.id,
                name: raw.animalSpecies.name,
                description: raw.animalSpecies.description ?? null,
            } : null,
            breed: raw.breed ?? null,
            breedId: raw.breedId ?? null,
            age: raw.age,
            userId: raw.userId,
            status: raw.status as Status,
            motherId: raw.motherId ?? null,
            motherCode: raw.motherCode ?? null,
            mother: raw.mother ? {
                id: raw.mother.id,
                tagNumber: raw.mother.tagNumber ?? null,
                name: raw.mother.name ?? null,
            } : null,
            fatherId: raw.fatherId ?? null,
            fatherCode: raw.fatherCode ?? null,
            father: raw.father ? {
                id: raw.father.id,
                tagNumber: raw.father.tagNumber ?? null,
                name: raw.father.name ?? null,
            } : null,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }

    static toPrisma(animal: AnimalEntity): PrismaAnimalRaw {
        return {
            id: animal.id,
            tagNumber: animal.tagNumber ?? null,
            name: animal.name ?? null,
            animalType: animal.animalType ?? null,
            animalSpeciesId: animal.animalSpeciesId ?? null,
            breed: animal.breed ?? null,
            breedId: animal.breedId ?? null,
            age: animal.age,
            userId: animal.userId,
            status: animal.status,
            motherId: animal.motherId ?? null,
            motherCode: animal.motherCode ?? null,
            fatherId: animal.fatherId ?? null,
            fatherCode: animal.fatherCode ?? null,
            createdAt: animal.createdAt,
            updatedAt: animal.updatedAt,
        };
    }
}

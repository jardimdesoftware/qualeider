import { DailyCollectionEntity } from '@/domain/entities/daily-collection.entity';
import { 
  DailyCollection as PrismaDailyCollection,
  MilkingPlace as PrismaMilkingPlace
} from '@prisma/client';
import { MilkingPlace, Status } from '@/domain/enums/enums';

export class DailyCollectionMapper {
  static toDomain(raw: PrismaDailyCollection & { items?: any[] }): DailyCollectionEntity {
    return new DailyCollectionEntity({
      id: raw.id,
      quantity: raw.quantity,
      collectionDate: raw.collectionDate,
      userId: raw.userId,
      numAnimals: raw.numAnimals,
      numOrdens: raw.numOrdens,
      rationProvided: raw.rationProvided,
      numLactation: raw.numLactation,
      milkingPlace: raw.milkingPlace as unknown as MilkingPlace,
      technicalAssistance: raw.technicalAssistance,
      status: raw.status as unknown as Status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      items: raw.items ? raw.items.map(item => ({
        id: item.id,
        dailyCollectionId: item.dailyCollectionId,
        animalId: item.animalId,
        quantity: item.quantity,
        animal: item.animal ? {
            id: item.animal.id,
            name: item.animal.name,
        } : undefined,
      })) : undefined,
    });
  }

  static toPersistence(dailyCollection: DailyCollectionEntity) {
    return {
      id: dailyCollection.id,
      quantity: dailyCollection.quantity,
      collectionDate: dailyCollection.collectionDate,
      userId: dailyCollection.userId,
      numAnimals: dailyCollection.numAnimals,
      numOrdens: dailyCollection.numOrdens,
      rationProvided: dailyCollection.rationProvided,
      numLactation: dailyCollection.numLactation,
      milkingPlace: dailyCollection.milkingPlace as unknown as PrismaMilkingPlace,
      technicalAssistance: dailyCollection.technicalAssistance,
      createdAt: dailyCollection.createdAt,
      updatedAt: dailyCollection.updatedAt,
    };
  }
}

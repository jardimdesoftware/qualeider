import { DailyCollectionEntity } from '@/domain/entities/daily-collection.entity';
import { MilkingPlace } from '@/domain/enums/enums';

describe('DailyCollectionEntity (domain)', () => {
  it('should capture collection data', () => {
    const now = new Date();
    const d: DailyCollectionEntity = {
      id: 100,
      quantity: 23.5,
      collectionDate: now,
      userId: 1,
      numAnimals: 12,
      numOrdens: 2,
      rationProvided: true,
      numLactation: 3,
      milkingPlace: MilkingPlace.Curral,
      technicalAssistance: false,
      createdAt: now,
      updatedAt: now,
    };

    expect(d.quantity).toBeGreaterThan(0);
    expect(d.milkingPlace).toBe(MilkingPlace.Curral);
  });
});

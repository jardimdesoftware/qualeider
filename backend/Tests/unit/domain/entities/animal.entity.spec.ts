import { AnimalEntity } from '@/domain/entities/animal.entity';
import { AnimalType, Status } from '@/domain/enums/enums';

describe('AnimalEntity (domain)', () => {
  it('should store basic animal fields', () => {
    const now = new Date();
    const animal: AnimalEntity = {
      id: 10,
      name: 'Estrela',
      animalType: AnimalType.Vaca,
      breed: 'Holandesa',
      age: 5,
      userId: 1,
      status: Status.Active,
      createdAt: now,
      updatedAt: now,
    };

    expect(animal.animalType).toBe(AnimalType.Vaca);
    expect(animal.breed).toBe('Holandesa');
  });
});

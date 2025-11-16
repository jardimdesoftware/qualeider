import { AnimalEntity } from '@/domain/entities/animal.entity';
import { AnimalType, Status } from '@/domain/enums/enums';

/**
 * Factory para criar entidades Animal com dados válidos para testes
 */
export class AnimalFactory {
  private static counter = 1;

  /**
   * Cria um AnimalEntity completo com valores padrão
   * @param userId - ID do usuário dono do animal
   * @param overrides - Campos para sobrescrever os valores padrão
   */
  static create(
    userId: number,
    overrides: Partial<AnimalEntity> = {},
  ): AnimalEntity {
    const id = AnimalFactory.counter++;
    const timestamp = new Date();

    return {
      id,
      name: `Animal ${id}`,
      animalType: AnimalType.Vaca,
      breed: 'Holandesa',
      age: 3,
      userId,
      status: Status.Active,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...overrides,
    };
  }

  /**
   * Cria um Animal com associação
   */
  static createWithAssociation(
    userId: number,
    overrides: Partial<AnimalEntity> = {},
  ): AnimalEntity {
    return this.create(userId, overrides);
  }

  /**
   * Cria um Animal jovem (idade < 2 anos)
   */
  static createYoung(
    userId: number,
    overrides: Partial<AnimalEntity> = {},
  ): AnimalEntity {
    return AnimalFactory.create(userId, {
      age: 1,
      ...overrides,
    });
  }

  /**
   * Cria múltiplos Animals para o mesmo usuário
   */
  static createMany(
    userId: number,
    count: number,
    overrides: Partial<AnimalEntity> = {},
  ): AnimalEntity[] {
    return Array.from({ length: count }, () =>
      AnimalFactory.create(userId, overrides),
    );
  }

  /**
   * Cria um Animal inativo
   */
  static createInactive(
    userId: number,
    overrides: Partial<AnimalEntity> = {},
  ): AnimalEntity {
    return AnimalFactory.create(userId, {
      status: Status.Inactive,
      ...overrides,
    });
  }

  /**
   * Reseta o contador de IDs
   */
  static resetCounter(): void {
    AnimalFactory.counter = 1;
  }
}

// Helper functions for easier imports
export const createAnimal = (
  overrides?: Partial<AnimalEntity> & { userId?: number },
) => {
  const userId = overrides?.userId || 1;
  return AnimalFactory.create(userId, overrides);
};
export const createManyAnimals = (
  count: number,
  overrides?: Partial<AnimalEntity> & { userId?: number },
) => {
  const userId = overrides?.userId || 1;
  return AnimalFactory.createMany(userId, count, overrides);
};

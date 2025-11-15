import { DailyCollectionEntity } from '@/domain/entities/daily-collection.entity';
import { MilkingPlace } from '@/domain/enums/enums';

/**
 * Factory para criar entidades DailyCollection com dados válidos para testes
 */
export class DailyCollectionFactory {
  private static counter = 1;

  /**
   * Cria um DailyCollectionEntity completo com valores padrão
   * @param userId - ID do usuário que criou a coleta
   * @param overrides - Campos para sobrescrever os valores padrão
   */
  static create(
    userId: number,
    overrides: Partial<DailyCollectionEntity> = {},
  ): DailyCollectionEntity {
    const id = DailyCollectionFactory.counter++;
    const timestamp = new Date();

    return {
      id,
      quantity: 50.5, // litros
      collectionDate: new Date(),
      userId,
      numAnimals: 10,
      numOrdens: 2,
      rationProvided: true,
      numLactation: 2,
      milkingPlace: MilkingPlace.Curral,
      technicalAssistance: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...overrides,
    };
  }

  /**
   * Cria uma coleta com associação (não aplicável, mas mantido para compatibilidade)
   */
  static createWithAssociation(
    userId: number,
    overrides: Partial<DailyCollectionEntity> = {},
  ): DailyCollectionEntity {
    return DailyCollectionFactory.create(userId, overrides);
  }

  /**
   * Cria uma coleta com alta produção
   */
  static createHighProduction(
    userId: number,
    overrides: Partial<DailyCollectionEntity> = {},
  ): DailyCollectionEntity {
    return DailyCollectionFactory.create(userId, {
      quantity: 150.0,
      numOrdens: 3,
      numAnimals: 25,
      rationProvided: true,
      technicalAssistance: true,
      ...overrides,
    });
  }

  /**
   * Cria múltiplas coletas para o mesmo usuário
   */
  static createMany(
    userId: number,
    count: number,
    overrides: Partial<DailyCollectionEntity> = {},
  ): DailyCollectionEntity[] {
    return Array.from({ length: count }, (_, index) => {
      const collectionDate = new Date();
      collectionDate.setDate(collectionDate.getDate() - index); // Cada dia anterior
      return DailyCollectionFactory.create(userId, {
        collectionDate,
        ...overrides,
      });
    });
  }

  /**
   * Reseta o contador de IDs
   */
  static resetCounter(): void {
    DailyCollectionFactory.counter = 1;
  }
}

// Helper functions for easier imports
export const createDailyCollection = (
  overrides?: Partial<DailyCollectionEntity> & { userId?: number },
) => {
  const userId = overrides?.userId || 1;
  return DailyCollectionFactory.create(userId, overrides);
};
export const createManyDailyCollections = (
  count: number,
  overrides?: Partial<DailyCollectionEntity> & { userId?: number },
) => {
  const userId = overrides?.userId || 1;
  return DailyCollectionFactory.createMany(userId, count, overrides);
};

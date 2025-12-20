import { MilkingPlace } from '@/domain/enums/enums';

export interface DailyCollectionFactoryData {
  quantity?: number;
  userId?: number;
  numAnimals?: number;
  numOrdens?: number;
  rationProvided?: boolean;
  numLactation?: number;
  milkingPlace?: MilkingPlace;
  technicalAssistance?: boolean;
  collectionDate?: string | Date;
  items?: { animalId: number; quantity: number }[];
}

/**
 * Factory para criar dados de coleta diária para testes E2E
 */
export class DailyCollectionFactory {
  private static counter = 0;

  /**
   * Gera dados padrão de coleta diária
   */
  static build(
    overrides: DailyCollectionFactoryData = {},
  ): DailyCollectionFactoryData {
    this.counter++;

    const defaultCollectionDate = (overrides as any).collectionDate || new Date().toISOString().split('T')[0];

    return {
      quantity: 25.5,
      numAnimals: 5,
      numOrdens: 2,
      rationProvided: true,
      numLactation: 2,
      milkingPlace: MilkingPlace.Curral,
      technicalAssistance: true,
      items: [
        { animalId: 10, quantity: 12.75 },
        { animalId: 11, quantity: 12.75 }
      ],
      collectionDate: defaultCollectionDate,
      ...overrides,
    };
  }

  /**
   * Cria dados de coleta com assistência técnica
   */
  static buildWithAssistance(
    overrides: DailyCollectionFactoryData = {},
  ): DailyCollectionFactoryData {
    return this.build({
      technicalAssistance: true,
      rationProvided: true,
      ...overrides,
    });
  }

  /**
   * Cria dados de coleta sem assistência técnica
   */
  static buildWithoutAssistance(
    overrides: DailyCollectionFactoryData = {},
  ): DailyCollectionFactoryData {
    return this.build({
      technicalAssistance: false,
      rationProvided: false,
      ...overrides,
    });
  }

  /**
   * Reseta o contador
   */
  static reset(): void {
    this.counter = 0;
  }
}

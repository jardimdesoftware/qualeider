import { AnimalType } from '@/domain/enums/enums';

export interface AnimalFactoryData {
  name?: string;
  animalType?: AnimalType;
  breed?: string;
  age?: number;
  userId?: number;
}

/**
 * Factory para criar dados de animal para testes E2E
 */
export class AnimalFactory {
  private static counter = 0;

  /**
   * Gera dados padrão de animal
   */
  static build(overrides: AnimalFactoryData = {}): AnimalFactoryData {
    this.counter++;

    return {
      name: `Animal Teste ${this.counter}`,
      animalType: AnimalType.Vaca,
      breed: 'Holandês',
      age: 5,
      ...overrides,
    };
  }

  /**
   * Cria dados de vaca
   */
  static buildVaca(overrides: AnimalFactoryData = {}): AnimalFactoryData {
    return this.build({
      name: `Vaca ${this.counter}`,
      animalType: AnimalType.Vaca,
      breed: 'Holandês',
      ...overrides,
    });
  }

  /**
   * Cria dados de cabra
   */
  static buildCabra(overrides: AnimalFactoryData = {}): AnimalFactoryData {
    return this.build({
      name: `Cabra ${this.counter}`,
      animalType: AnimalType.Cabra,
      breed: 'Saanen',
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

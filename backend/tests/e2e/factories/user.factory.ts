import { UserCategory } from '@/domain/enums/enums';

export interface UserFactoryData {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  userCategory?: UserCategory;
  city?: string;
  state?: string;
  associationId?: number;
}

/**
 * Factory para criar dados de usuário para testes E2E
 */
export class UserFactory {
  private static counter = 0;

  /**
   * Gera dados padrão de usuário
   */
  static build(overrides: UserFactoryData = {}): UserFactoryData {
    this.counter++;

    return {
      name: `Usuário Teste ${this.counter}`,
      email: `user${this.counter}@test.com`,
      password: 'Test@1234',
      userCategory: UserCategory.Fisica,
      city: 'São Paulo',
      state: 'SP',
      ...overrides,
    };
  }

  /**
   * Cria dados de usuário admin
   */
  static buildAdmin(overrides: UserFactoryData = {}): UserFactoryData {
    return this.build({
      name: `Admin ${this.counter}`,
      email: `admin${this.counter}@test.com`,
      userCategory: UserCategory.Juridica,
      ...overrides,
    });
  }

  /**
   * Cria dados de usuário físico (produtor)
   */
  static buildProducer(overrides: UserFactoryData = {}): UserFactoryData {
    return this.build({
      name: `Produtor ${this.counter}`,
      email: `producer${this.counter}@test.com`,
      userCategory: UserCategory.Fisica,
      ...overrides,
    });
  }

  /**
   * Reseta o contador (útil para testes isolados)
   */
  static reset(): void {
    this.counter = 0;
  }
}

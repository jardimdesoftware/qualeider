export interface InviteFactoryData {
  userId?: number;
  message?: string;
}

/**
 * Factory para criar dados de convite para testes E2E
 */
export class InviteFactory {
  private static counter = 0;

  /**
   * Gera dados padrão de convite
   */
  static build(overrides: InviteFactoryData = {}): InviteFactoryData {
    this.counter++;

    return {
      message: `Convite de teste ${this.counter}. Venha fazer parte da nossa associação!`,
      ...overrides,
    };
  }

  /**
   * Cria convite com mensagem personalizada
   */
  static buildWithMessage(
    message: string,
    overrides: InviteFactoryData = {},
  ): InviteFactoryData {
    return this.build({
      message,
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

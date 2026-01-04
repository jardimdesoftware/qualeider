/**
 * Constantes de regras de negócio da aplicação.
 * Centraliza valores que definem comportamentos e cálculos do sistema.
 */

export const HERD_BUSINESS_RULES = {
  /**
   * Percentual estimado de vacas adultas que estão em lactação.
   * Usado para cálculos estatísticos do rebanho.
   * @default 0.7 (70%)
   */
  LACTATING_COWS_PERCENTAGE: 0.7,
} as const;

export const COLLECTION_BUSINESS_RULES = {
  /**
   * Tolerância máxima (em litros) para diferenças entre a soma dos itens
   * e a quantidade total declarada na coleta.
   * Usado para validação de consistência de dados.
   * @default 0.01 (10ml de tolerância para arredondamentos)
   */
  QUANTITY_TOLERANCE: 0.01,
} as const;

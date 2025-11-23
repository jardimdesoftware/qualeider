/**
 * Critérios de filtragem para busca de coletas diárias.
 * 
 * @property associationId - Filtrar por ID da associação
 * @property userId - Filtrar por ID do usuário/produtor
 * @property dateRange - Filtrar por intervalo de datas
 * @property includeUser - Se true, traz os dados do usuário/produtor
 */
export interface DailyCollectionCriteria {
  associationId?: number;
  userId?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeUser?: boolean;
}

import { PaginationParams } from '../common/pagination.interface';

/**
 * Critérios de filtragem para busca de coletas diárias.
 * 
 * @property associationId - Filtrar por ID da associação
 * @property userId - Filtrar por ID do usuário/produtor
 * @property dateRange - Filtrar por intervalo de datas
 * @property includeUser - Se true, traz os dados do usuário/produtor
 * @property page - Número da página (padrão: 1)
 * @property limit - Limite de registros por página (padrão: 50, máx: 1000)
 */
export interface DailyCollectionCriteria extends PaginationParams {
  associationId?: number;
  userId?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeUser?: boolean;
}

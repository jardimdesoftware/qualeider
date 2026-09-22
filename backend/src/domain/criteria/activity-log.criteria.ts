import { PaginationParams } from '../common/pagination.interface';

/**
 * Critérios de filtragem para busca do histórico de atividade de um usuário.
 *
 * @property userId - ID do usuário (Vaqueiro ou Admin) cujo histórico será listado
 * @property page - Número da página (padrão: 1)
 * @property limit - Limite de registros por página (padrão: 50, máx: 1000)
 */
export interface ActivityLogCriteria extends PaginationParams {
  userId: number;
}

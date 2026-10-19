import { HerdScope } from '@/domain/utils/herd-scope.util';
import { PaginationParams } from '../common/pagination.interface';

/**
 * Critérios de filtragem para busca de usuários.
 * 
 * @property status - Filtrar por status (padrão: 'Active' se não informado)
 * @property emailContains - Filtrar por email que contenha o texto
 * @property includeAnimals - Se true, traz os animais do usuário
 * @property page - Número da página (padrão: 1)
 * @property limit - Limite de registros por página (padrão: 50, máx: 1000)
 */
export interface UserCriteria extends PaginationParams {
  ids?: number[];
  /** Escopo obrigatório de quem lê; aplicado com AND sobre os demais filtros. */
  scope?: HerdScope;
  status?: 'Active' | 'Inactive';
  emailContains?: string;
  includeAnimals?: boolean;
}

import { PaginationParams } from '../common/pagination.interface';

/**
 * Critérios de filtragem para busca de usuários.
 * 
 * @property associationId - Filtrar por ID da associação
 * @property status - Filtrar por status (padrão: 'Active' se não informado)
 * @property emailContains - Filtrar por email que contenha o texto
 * @property includeAnimals - Se true, traz os animais do usuário
 * @property includeAssociation - Se true, traz os dados da associação
 * @property page - Número da página (padrão: 1)
 * @property limit - Limite de registros por página (padrão: 50, máx: 1000)
 */
export interface UserCriteria extends PaginationParams {
  ids?: number[];
  associationId?: number;
  status?: 'Active' | 'Inactive';
  emailContains?: string;
  includeAnimals?: boolean;
  includeAssociation?: boolean;
}

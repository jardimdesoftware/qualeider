import { AnimalType } from '@/domain/enums/enums';
import { PaginationParams } from '../common/pagination.interface';

/**
 * Critérios de filtragem para busca de animais.
 * 
 * @property associationId - Filtrar por ID da associação
 * @property userId - Filtrar por ID do usuário/produtor
 * @property status - Filtrar por status (padrão: 'Active' se não informado)
 * @property includeUser - Se true, traz os dados do usuário/produtor
 * @property animalType - Filtrar por tipo de animal
 * @property page - Número da página (padrão: 1)
 * @property limit - Limite de registros por página (padrão: 50, máx: 1000)
 */
export interface AnimalCriteria extends PaginationParams {
  associationId?: number;
  userId?: number;
  status?: 'Active' | 'Inactive';
  includeUser?: boolean;
  animalType?: AnimalType;
}

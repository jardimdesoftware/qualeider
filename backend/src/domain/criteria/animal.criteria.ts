import { AnimalType } from '@/domain/enums/enums';
import { PaginationParams } from '../common/pagination.interface';

/**
 * Criterios de filtragem para busca de animais.
 *
 * @property associationId - Filtrar por ID da associacao
 * @property userId - Filtrar por ID do usuario/produtor
 * @property status - Filtrar por status (padrao: 'Active' se nao informado)
 * @property includeUser - Se true, traz os dados do usuario/produtor
 * @property animalType - Filtrar por tipo de animal
 * @property tagNumber - Filtrar por numero de identificacao (busca parcial)
 * @property page - Numero da pagina (padrao: 1)
 * @property limit - Limite de registros por pagina (padrao: 50, max: 1000)
 */
export interface AnimalCriteria extends PaginationParams {
  associationId?: number;
  userId?: number;
  status?: 'Active' | 'Inactive';
  includeUser?: boolean;
  animalType?: AnimalType;
  tagNumber?: string;
}

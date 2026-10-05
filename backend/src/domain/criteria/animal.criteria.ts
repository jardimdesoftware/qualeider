import { HerdScope } from '@/domain/utils/herd-scope.util';
import { AnimalType } from '@/domain/enums/enums';
import { PaginationParams } from '../common/pagination.interface';

/**
 * Criterios de filtragem para busca de animais.
 *
 * @property associationId - Filtrar por ID da associacao
 * @property userId - Filtrar por ID do usuario/produtor
 * @property adminGroupId - Filtrar pelo grupo Admin+Vaqueiros (animais cujo dono
 *   e o Admin com esse ID, ou um Vaqueiro cadastrado por esse Admin)
 * @property status - Filtrar por status (padrao: 'Active' se nao informado)
 * @property includeInactive - Se true e status nao informado, nao filtra por
 *   status (traz Active e Inactive). Usado pela tela de gestao do rebanho,
 *   que decide a exibicao no client (toggle "Mostrar inativos").
 * @property includeUser - Se true, traz os dados do usuario/produtor
 * @property animalType - Filtrar por tipo de animal (legado)
 * @property animalSpeciesId - Filtrar por ID do tipo de animal (tabela AnimalSpecies)
 * @property tagNumber - Filtrar por numero de identificacao (busca parcial)
 * @property page - Numero da pagina (padrao: 1)
 * @property limit - Limite de registros por pagina (padrao: 50, max: 1000)
 */
export interface AnimalCriteria extends PaginationParams {
  associationId?: number;
  userId?: number;
  adminGroupId?: number;
  /** Escopo obrigatório de quem lê; aplicado com AND sobre os demais filtros. */
  scope?: HerdScope;
  status?: 'Active' | 'Inactive';
  includeInactive?: boolean;
  includeUser?: boolean;
  animalType?: AnimalType;
  animalSpeciesId?: number;
  tagNumber?: string;
}

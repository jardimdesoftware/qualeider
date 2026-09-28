import { ID } from '@/domain/enums/enums';
import { AnimalEntity } from '@/domain/entities/animal.entity';
import { AnimalCriteria } from '@/domain/criteria/animal.criteria';
import { HerdScope } from '@/domain/utils/herd-scope.util';
import { PaginatedResult } from '@/domain/common/pagination.interface';

export const IAnimalRepository = Symbol('IAnimalRepository');

export interface AnimalFindOneOptions {
  includeUser?: boolean;
}

export interface AnimalProductionSummary {
  animalId: number;
  name: string | null;
  tagNumber: string | null;
  totalProduction: number;
  collectionsCount: number;
  avgProduction: number;
}

export interface IAnimalRepository {
  create(
    data: Omit<AnimalEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: string;
    },
  ): Promise<AnimalEntity>;
  findAll(criteria?: AnimalCriteria): Promise<PaginatedResult<AnimalEntity>>;
  findById(id: ID, options?: AnimalFindOneOptions): Promise<AnimalEntity | null>;
  findByIds(ids: ID[], options?: AnimalFindOneOptions): Promise<AnimalEntity[]>;
  /**
   * Busca um animal com o mesmo tagNumber dentro do escopo de rebanho informado
   * (associacao, grupo Admin+Vaqueiros, ou usuario isolado), opcionalmente
   * excluindo o proprio animal (usado em updates).
   */
  findConflictingTagNumber(
    scope: HerdScope,
    tagNumber: string,
    excludeAnimalId?: ID,
  ): Promise<AnimalEntity | null>;
  findPendingByParentCode(userId: ID, tagNumber: string): Promise<AnimalEntity[]>;
  update(id: ID, data: Partial<AnimalEntity>): Promise<AnimalEntity>;
  softDelete(id: ID): Promise<AnimalEntity>;
  /**
   * Producao total (litros) de cada animal ativo do escopo de rebanho
   * informado, opcionalmente filtrada por periodo. Usado no relatorio geral
   * (visao "todas as vacas") em vez de um ranking entre produtores, ja que
   * o produto so tem uma fazenda por Admin (sem multiplos produtores).
   */
  findProductionSummary(
    scope: HerdScope,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AnimalProductionSummary[]>;
}

import { ID } from '@/domain/enums/enums';
import { AnimalEntity } from '@/domain/entities/animal.entity';
import { AnimalCriteria } from '@/domain/criteria/animal.criteria';
import { PaginatedResult } from '@/domain/common/pagination.interface';

export const IAnimalRepository = Symbol('IAnimalRepository');

export interface AnimalFindOneOptions {
  includeUser?: boolean;
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
  findByTagNumber(userId: ID, tagNumber: string): Promise<AnimalEntity | null>;
  findPendingByParentCode(userId: ID, tagNumber: string): Promise<AnimalEntity[]>;
  update(id: ID, data: Partial<AnimalEntity>): Promise<AnimalEntity>;
  softDelete(id: ID): Promise<AnimalEntity>;
}

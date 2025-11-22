import { ID } from '@/domain/enums/enums';
import { AnimalEntity } from '@/domain/entities/animal.entity';
import { AnimalCriteria } from '@/domain/criteria/animal.criteria';

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
  findAll(criteria?: AnimalCriteria): Promise<AnimalEntity[]>;
  findById(id: ID, options?: AnimalFindOneOptions): Promise<AnimalEntity | null>;
  update(id: ID, data: Partial<AnimalEntity>): Promise<AnimalEntity>;
  softDelete(id: ID): Promise<void>;
}
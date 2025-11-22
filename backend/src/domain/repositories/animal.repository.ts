import { ID } from '@/domain/enums/enums';
import { AnimalEntity } from '@/domain/entities/animal.entity';

export const IAnimalRepository = Symbol('IAnimalRepository');

import { AnimalCriteria } from '@/domain/criteria/animal.criteria';

export interface IAnimalRepository {
  create(
    data: Omit<AnimalEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: string;
    },
  ): Promise<AnimalEntity>;
  findAll(criteria?: AnimalCriteria): Promise<AnimalEntity[]>;
  findById(id: ID): Promise<AnimalEntity | null>;
  update(id: ID, data: Partial<AnimalEntity>): Promise<AnimalEntity>;
  softDelete(id: ID): Promise<void>;
  findAllByUserId(userId: ID): Promise<AnimalEntity[]>;
}

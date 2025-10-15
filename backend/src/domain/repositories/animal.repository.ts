import { ID } from '@/domain/enums/enums';
import { AnimalEntity } from '@/domain/entities/animal.entity';

export const IAnimalRepository = Symbol('IAnimalRepository');

export interface IAnimalRepository {
  create(
    data: Omit<AnimalEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: string;
    },
  ): Promise<AnimalEntity>;
  findAllActive(): Promise<AnimalEntity[]>;
  findById(id: ID): Promise<AnimalEntity | null>;
  update(id: ID, data: Partial<AnimalEntity>): Promise<AnimalEntity>;
  softDelete(id: ID): Promise<void>;
  findAllByUserId(userId: ID): Promise<AnimalEntity[]>;
}

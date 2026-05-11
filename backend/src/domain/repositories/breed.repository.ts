import { ID } from '@/domain/enums/enums';
import { BreedEntity } from '@/domain/entities/breed.entity';

export const IBreedRepository = Symbol('IBreedRepository');

export interface IBreedRepository {
  create(data: Omit<BreedEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<BreedEntity>;
  findAll(): Promise<BreedEntity[]>;
  findById(id: ID): Promise<BreedEntity | null>;
  findByName(name: string): Promise<BreedEntity | null>;
  update(id: ID, data: Partial<BreedEntity>): Promise<BreedEntity>;
  delete(id: ID): Promise<void>;
}

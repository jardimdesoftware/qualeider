import { ID } from '@/domain/enums/enums';
import { AnimalSpeciesEntity } from '@/domain/entities/animal-species.entity';

export const IAnimalSpeciesRepository = Symbol('IAnimalSpeciesRepository');

export interface IAnimalSpeciesRepository {
  create(data: Omit<AnimalSpeciesEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnimalSpeciesEntity>;
  findAll(): Promise<AnimalSpeciesEntity[]>;
  findById(id: ID): Promise<AnimalSpeciesEntity | null>;
  findByName(name: string): Promise<AnimalSpeciesEntity | null>;
  update(id: ID, data: Partial<AnimalSpeciesEntity>): Promise<AnimalSpeciesEntity>;
  delete(id: ID): Promise<void>;
}

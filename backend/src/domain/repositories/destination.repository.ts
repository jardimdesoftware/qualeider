import { ID } from '@/domain/enums/enums';
import { DestinationEntity } from '@/domain/entities/destination.entity';

export const IDestinationRepository = Symbol('IDestinationRepository');

export interface IDestinationRepository {
  create(data: Omit<DestinationEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DestinationEntity>;
  findAll(): Promise<DestinationEntity[]>;
  findById(id: ID): Promise<DestinationEntity | null>;
  findByName(name: string): Promise<DestinationEntity | null>;
  update(id: ID, data: Partial<DestinationEntity>): Promise<DestinationEntity>;
  delete(id: ID): Promise<void>;
}

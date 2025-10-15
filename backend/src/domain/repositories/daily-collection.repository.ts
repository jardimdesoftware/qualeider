import { ID } from '@/domain/enums/enums';
import { DailyCollectionEntity } from '@/domain/entities/daily-collection.entity';

export const IDailyCollectionRepository = Symbol('IDailyCollectionRepository');

export interface IDailyCollectionRepository {
  create(
    data: Omit<DailyCollectionEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DailyCollectionEntity>;
  findAll(): Promise<DailyCollectionEntity[]>;
  findById(id: ID): Promise<DailyCollectionEntity | null>;
  update(
    id: ID,
    data: Partial<DailyCollectionEntity>,
  ): Promise<DailyCollectionEntity>;
  delete(id: ID): Promise<void>;
  checkIfUserAlreadySubmitted(userId: ID): Promise<boolean>;
  findAllByUserId(userId: ID): Promise<DailyCollectionEntity[]>;
}

import { ID } from '@/domain/enums/enums';
import { DailyCollectionEntity } from '@/domain/entities/daily-collection.entity';
import { DailyCollectionCriteria } from '@/domain/criteria/daily-collection.criteria';

export const IDailyCollectionRepository = Symbol('IDailyCollectionRepository');

export interface DailyCollectionFindOneOptions {
  includeUser?: boolean;
}

export interface IDailyCollectionRepository {
  create(
    data: Omit<DailyCollectionEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DailyCollectionEntity>;
  findAll(criteria?: DailyCollectionCriteria): Promise<DailyCollectionEntity[]>;
  findById(id: ID, options?: DailyCollectionFindOneOptions): Promise<DailyCollectionEntity | null>;
  update(
    id: ID,
    data: Partial<DailyCollectionEntity>,
  ): Promise<DailyCollectionEntity>;
  delete(id: ID): Promise<void>;
  checkIfUserAlreadySubmitted(userId: ID): Promise<boolean>;
}
import { ID } from '@/domain/enums/enums';
import { DailyCollectionEntity } from '@/domain/entities/daily-collection.entity';

export const IDailyCollectionRepository = Symbol('IDailyCollectionRepository');

import { DailyCollectionCriteria } from '@/domain/criteria/daily-collection.criteria';

export interface IDailyCollectionRepository {
  create(
    data: Omit<DailyCollectionEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DailyCollectionEntity>;
  findAll(criteria?: DailyCollectionCriteria): Promise<DailyCollectionEntity[]>;
  findById(id: ID): Promise<DailyCollectionEntity | null>;
  update(
    id: ID,
    data: Partial<DailyCollectionEntity>,
  ): Promise<DailyCollectionEntity>;
  delete(id: ID): Promise<void>;
  checkIfUserAlreadySubmitted(userId: ID): Promise<boolean>;
  findAllByUserId(userId: ID): Promise<DailyCollectionEntity[]>;
}

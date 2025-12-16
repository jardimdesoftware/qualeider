import { ID } from '@/domain/enums/enums';
import { DailyCollectionEntity, DailyCollectionItem } from '@/domain/entities/daily-collection.entity';
import { DailyCollectionCriteria } from '@/domain/criteria/daily-collection.criteria';

export const IDailyCollectionRepository = Symbol('IDailyCollectionRepository');

export interface DailyCollectionFindOneOptions {
  includeUser?: boolean;
}

export type CreateDailyCollectionData = Omit<DailyCollectionEntity, 'id' | 'createdAt' | 'updatedAt' | 'items'> & {
  items?: Omit<DailyCollectionItem, 'id' | 'dailyCollectionId'>[];
};

export interface IDailyCollectionRepository {
  create(data: CreateDailyCollectionData): Promise<DailyCollectionEntity>;
  findAll(criteria?: DailyCollectionCriteria): Promise<DailyCollectionEntity[]>;
  findById(id: ID, options?: DailyCollectionFindOneOptions): Promise<DailyCollectionEntity | null>;
  update(
    id: ID,
    data: Partial<DailyCollectionEntity>,
  ): Promise<DailyCollectionEntity>;
  delete(id: ID): Promise<void>;
}
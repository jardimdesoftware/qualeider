import { ID } from '@/domain/enums/enums';
import { UserEntity } from '@/domain/entities/user.entity';

export const IUserRepository = Symbol('IUserRepository');

import { UserCriteria } from '@/domain/criteria/user.criteria';

export interface IUserRepository {
  create(
    data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: string;
    },
  ): Promise<UserEntity>;
  findAll(criteria?: UserCriteria): Promise<Array<Omit<UserEntity, 'password'>>>;
  findById(id: ID): Promise<Omit<UserEntity, 'password'> | null>;
  update(
    id: ID,
    data: Partial<UserEntity>,
  ): Promise<Omit<UserEntity, 'password'>>;
  partialUpdate(
    id: ID,
    data: Partial<UserEntity>,
  ): Promise<Omit<UserEntity, 'password'>>;
  softDelete(id: ID): Promise<void>;
  findByEmail(email: string): Promise<UserEntity | null>;
}

import { ID } from '@/domain/enums/enums';
import { UserEntity } from '@/domain/entities/user.entity';
import { UserCriteria } from '@/domain/criteria/user.criteria';
import { PaginatedResult } from '@/domain/common/pagination.interface';

export const IUserRepository = Symbol('IUserRepository');

export interface UserFindOneOptions {
  includeAnimals?: boolean;
  includeAssociation?: boolean;
}

export interface IUserRepository {
  create(
    data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: string;
    },
  ): Promise<UserEntity>;
  findAll(criteria?: UserCriteria): Promise<PaginatedResult<Omit<UserEntity, 'password'>>>;
  findById(
    id: ID,
    options?: UserFindOneOptions
  ): Promise<Omit<UserEntity, 'password'> | null>;
  /**
   * Busca por ID sem filtrar por status (ativo/inativo). Usado para
   * checagens de autorizacao (ex.: um ADMIN reativando um funcionario
   * inativo) onde `findById` filtraria o registro incorretamente.
   */
  findByIdAny(id: ID): Promise<Omit<UserEntity, 'password'> | null>;
  update(
    id: ID,
    data: Partial<UserEntity>,
  ): Promise<Omit<UserEntity, 'password'>>;
  partialUpdate(
    id: ID,
    data: Partial<UserEntity>,
  ): Promise<Omit<UserEntity, 'password'>>;
  softDelete(id: ID): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
}
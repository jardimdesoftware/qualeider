import { InviteEntity } from '@/domain/entities/invite.entity';
import { InviteCriteria } from '@/domain/criteria/invite.criteria';

export const IInviteRepository = Symbol('IInviteRepository');

export interface InviteFindOneOptions {
  includeUser?: boolean;
  includeAssociation?: boolean;
}

export interface IInviteRepository {
  create(data: any): Promise<InviteEntity>;
  findAll(criteria?: InviteCriteria, options?: InviteFindOneOptions): Promise<InviteEntity[]>;
  findById(id: number, options?: InviteFindOneOptions): Promise<InviteEntity | null>;
  findByToken(token: string, options?: InviteFindOneOptions): Promise<InviteEntity | null>;
  update(id: number, data: any): Promise<InviteEntity>;
  expireOldInvites(): Promise<number>;
}

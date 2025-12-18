import { InviteStatus } from '@/domain/enums/enums';
import { UserEntity } from './user.entity';
import { AssociationEntity } from './association.entity';

export class InviteEntity {
  id!: number;
  token!: string;
  message!: string;
  customMessage?: string;
  status!: InviteStatus;
  sentAt!: Date;
  expiresAt!: Date;
  respondedAt?: Date;
  userId!: number;
  associationId!: number;
  user?: UserEntity;
  association?: AssociationEntity;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<InviteEntity>) {
    Object.assign(this, partial);
  }
}

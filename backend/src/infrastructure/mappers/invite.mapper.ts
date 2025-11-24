import { InviteEntity } from '@/domain/entities/invite.entity';
import { 
  Invite as PrismaInvite, 
  User as PrismaUser, 
  Association as PrismaAssociation,
  InviteStatus as PrismaInviteStatus
} from '@prisma/client';
import { UserMapper } from './user.mapper';
import { AssociationMapper } from './association.mapper';
import { InviteStatus } from '@/domain/enums/enums';

// Tipo auxiliar para quando o Invite vem com relacionamentos (Include)
type PrismaInviteWithRelations = PrismaInvite & {
  user?: PrismaUser | null;
  association?: PrismaAssociation | null;
};

export class InviteMapper {
  static toDomain(raw: PrismaInviteWithRelations): InviteEntity {
    return new InviteEntity({
      id: raw.id,
      token: raw.token,
      message: raw.message ?? '',
      customMessage: raw.customMessage ?? undefined,
      status: raw.status as unknown as InviteStatus, 
      sentAt: raw.sentAt,
      expiresAt: raw.expiresAt,
      respondedAt: raw.respondedAt ?? undefined,
      userId: raw.userId,
      associationId: raw.associationId,
      user: raw.user ? UserMapper.toDomain(raw.user) : undefined,
      association: raw.association ? AssociationMapper.toDomain(raw.association) : undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(invite: InviteEntity) {
    return {
      id: invite.id,
      associationId: invite.associationId,
      userId: invite.userId,
      token: invite.token,
      status: invite.status as unknown as PrismaInviteStatus,
      message: invite.message,
      customMessage: invite.customMessage,
      sentAt: invite.sentAt,
      expiresAt: invite.expiresAt,
      respondedAt: invite.respondedAt,
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
    };
  }
}

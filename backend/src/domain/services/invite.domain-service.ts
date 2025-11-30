import { Injectable } from '@nestjs/common';
import { InviteEntity } from '@/domain/entities/invite.entity';
import { InviteStatus } from '@/domain/enums/enums';
import { BusinessException } from '@/common/exceptions/business.exception';
import { INVITE_EXPIRATION_DAYS } from '@/common/constants/business-rules.constants';

@Injectable()
export class InviteDomainService {
  calculateExpirationDate(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRATION_DAYS);
    return expiresAt;
  }

  isExpired(invite: InviteEntity): boolean {
    return new Date() > invite.expiresAt;
  }

  validateForAcceptance(invite: InviteEntity): void {
    if (invite.status !== InviteStatus.PENDING) {
      throw new BusinessException(
        `Convite já foi ${invite.status.toLowerCase()}`,
      );
    }

    if (new Date() > invite.expiresAt) {
      throw new BusinessException('Convite expirado');
    }
  }

  accept(invite: InviteEntity): InviteEntity {
    this.validateForAcceptance(invite);

    invite.status = InviteStatus.ACCEPTED;
    invite.respondedAt = new Date();

    return invite;
  }

  decline(invite: InviteEntity): InviteEntity {
    if (invite.status !== InviteStatus.PENDING) {
      throw new BusinessException(
        `Convite já foi ${invite.status.toLowerCase()}`,
      );
    }

    invite.status = InviteStatus.DECLINED;
    invite.respondedAt = new Date();

    return invite;
  }

  cancel(invite: InviteEntity): InviteEntity {
    if (invite.status !== InviteStatus.PENDING) {
      throw new BusinessException('Apenas convites pendentes podem ser cancelados');
    }

    invite.status = InviteStatus.CANCELED;
    invite.respondedAt = new Date();

    return invite;
  }
}

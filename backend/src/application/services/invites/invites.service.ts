import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InviteCreatedEvent } from '@/events/invite-created.event';
import { InviteAcceptedEvent } from '@/events/invite-accepted.event';
import { InviteDeclinedEvent } from '@/events/invite-declined.event';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { INVITE_EXPIRATION_DAYS } from '@/common/constants/business-rules.constants';
import { InviteStatus, InviteAction } from '@/domain/enums/enums';
import { IInviteRepository } from '@/domain/repositories/invite.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IAssociationRepository } from '@/domain/repositories/association.repository';

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    @Inject(IInviteRepository)
    private readonly inviteRepository: IInviteRepository,
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    @Inject(IAssociationRepository)
    private readonly associationRepository: IAssociationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async validateInvitePrerequisites(
    associationId: number,
    userId: number,
  ) {
    const association = await this.associationRepository.findById(associationId);

    if (!association) {
      throw new EntityNotFoundException('Associação não encontrada');
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new EntityNotFoundException('Usuário não encontrado');
    }

    if (user.associationId === associationId) {
      throw new BusinessException(
        'Usuário já está vinculado a esta associação',
      );
    }

    const existingInvites = await this.inviteRepository.findAll({
      associationId,
      userId,
      status: InviteStatus.PENDING,
    });

    if (existingInvites.length > 0) {
      throw new BusinessException(
        'Já existe um convite pendente para este usuário',
      );
    }

    return { user, association };
  }

  /**
   * Associação envia convite para um usuário
   */
  async createInvite(associationId: number, dto: CreateInviteDto) {
    const { user, association } = await this.validateInvitePrerequisites(
      associationId,
      dto.userId,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRATION_DAYS);

    const invite = await this.inviteRepository.create({
      associationId,
      userId: dto.userId,
      message: dto.message,
      expiresAt,
      status: InviteStatus.PENDING,
    });

    const event = new InviteCreatedEvent(
      invite.id,
      user.id,
      user.name,
      user.email,
      association.id,
      association.name,
      invite.message,
      invite.token,
      invite.expiresAt,
    );

    this.eventEmitter.emit('invite.created', event);

    return {
      id: invite.id,
      token: invite.token,
      message: 'Convite enviado com sucesso',
      expiresAt: invite.expiresAt,
    };
  }

  /**
   * Usuário aceita ou recusa convite via token
   */
  async respondToInvite(token: string, response: InviteAction) {
    const invite = await this.inviteRepository.findByToken(token, {
      includeUser: true,
      includeAssociation: true,
    });

    if (!invite) {
      throw new EntityNotFoundException('Convite não encontrado');
    }

    const user = (invite as any).user;
    const association = (invite as any).association;

    if (invite.status !== InviteStatus.PENDING) {
      throw new BusinessException(
        `Convite já foi ${invite.status.toLowerCase()}`,
      );
    }

    if (new Date() > invite.expiresAt) {
      await this.inviteRepository.update(invite.id, {
        status: InviteStatus.EXPIRED,
      });
      throw new BusinessException('Convite expirado');
    }

    if (response === InviteAction.ACCEPT) {
      await this.inviteRepository.update(invite.id, {
        status: InviteStatus.ACCEPTED,
        respondedAt: new Date(),
      });

      await this.userRepository.update(invite.userId, {
        associationId: invite.associationId,
      });

      const event = new InviteAcceptedEvent(
        invite.id,
        user.id,
        user.name,
        association.id,
        association.name,
      );

      this.eventEmitter.emit('invite.accepted', event);

      return {
        message: `Você agora faz parte da ${association.name}!`,
        associationId: invite.associationId,
        associationName: association.name,
      };
    } else {
      await this.inviteRepository.update(invite.id, {
        status: InviteStatus.DECLINED,
        respondedAt: new Date(),
      });

      const event = new InviteDeclinedEvent(
        invite.id,
        user.id,
        user.name,
        association.id,
        association.name,
      );

      this.eventEmitter.emit('invite.declined', event);

      return {
        message: 'Convite recusado',
      };
    }
  }

  async getUserPendingInvites(userId: number) {
    return this.inviteRepository.findAll(
      {
        userId,
        status: InviteStatus.PENDING,
        expiresAfter: new Date(),
      },
      { includeAssociation: true },
    );
  }

  async getAssociationInvites(associationId: number, status?: InviteStatus) {
    return this.inviteRepository.findAll(
      {
        associationId,
        status,
      },
      { includeUser: true },
    );
  }

  async cancelInvite(associationId: number, inviteId: number) {
    const invite = await this.inviteRepository.findById(inviteId);

    if (
      !invite ||
      invite.associationId !== associationId ||
      invite.status !== InviteStatus.PENDING
    ) {
      throw new EntityNotFoundException(
        'Convite não encontrado ou já foi respondido',
      );
    }

    await this.inviteRepository.update(inviteId, {
      status: InviteStatus.CANCELED,
      respondedAt: new Date(),
    });

    return { message: 'Convite cancelado com sucesso' };
  }

  async getInviteByToken(token: string) {
    const invite = await this.inviteRepository.findByToken(token, {
      includeUser: true,
      includeAssociation: true,
    });

    if (!invite) {
      throw new EntityNotFoundException('Convite não encontrado');
    }

    const isExpired = new Date() > invite.expiresAt;

    return {
      id: invite.id,
      status: invite.status,
      message: invite.message,
      sentAt: invite.sentAt,
      expiresAt: invite.expiresAt,
      isExpired,
      association: (invite as any).association,
      user: (invite as any).user,
    };
  }
}

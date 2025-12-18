import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InviteCreatedEvent } from '@/events/invite-created.event';
import { InviteAcceptedEvent } from '@/events/invite-accepted.event';
import { InviteDeclinedEvent } from '@/events/invite-declined.event';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { InviteStatus, InviteAction } from '@/domain/enums/enums';
import { IInviteRepository } from '@/domain/repositories/invite.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IAssociationRepository } from '@/domain/repositories/association.repository';

import { InviteDomainService } from '@/domain/services/invite.domain-service';

@Injectable()
export class InvitesService {

  constructor(
    @Inject(IInviteRepository)
    private readonly inviteRepository: IInviteRepository,
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    @Inject(IAssociationRepository)
    private readonly associationRepository: IAssociationRepository,
    private readonly inviteDomainService: InviteDomainService,
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

  async createInvite(associationId: number, dto: CreateInviteDto) {
    const { user, association } = await this.validateInvitePrerequisites(
      associationId,
      dto.userId,
    );

    const expiresAt = this.inviteDomainService.calculateExpirationDate();

    const invite = await this.inviteRepository.create({
      associationId,
      userId: dto.userId,
      message: dto.message,
      expiresAt,
      status: InviteStatus.PENDING,
    });

    const event = new InviteCreatedEvent({
      inviteId: invite.id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      associationId: association.id,
      associationName: association.name,
      message: invite.message,
      token: invite.token,
      expiresAt: invite.expiresAt,
    });

    this.eventEmitter.emit('invite.created', event);

    return {
      id: invite.id,
      token: invite.token,
      message: 'Convite enviado com sucesso',
      expiresAt: invite.expiresAt,
    };
  }

  async respondToInvite(token: string, response: InviteAction) {
    const invite = await this.inviteRepository.findByToken(token, {
      includeUser: true,
      includeAssociation: true,
    });

    if (!invite) {
      throw new EntityNotFoundException('Convite não encontrado');
    }

    const user = invite.user;
    const association = invite.association;

    if (!user || !association) {
        throw new EntityNotFoundException('Dados do convite incompletos');
    }

    if (response === InviteAction.ACCEPT) {
      this.inviteDomainService.accept(invite);

      await this.inviteRepository.update(invite.id, {
        status: invite.status,
        respondedAt: invite.respondedAt,
      });

      await this.userRepository.update(invite.userId, {
        associationId: invite.associationId,
      });

      const event = new InviteAcceptedEvent({
        inviteId: invite.id,
        userId: user.id,
        userName: user.name,
        associationId: association.id,
        associationName: association.name,
      });

      this.eventEmitter.emit('invite.accepted', event);

      return {
        message: `Você agora faz parte da ${association.name}!`,
        associationId: invite.associationId,
        associationName: association.name,
      };
    } else {
      this.inviteDomainService.decline(invite);

      await this.inviteRepository.update(invite.id, {
        status: invite.status,
        respondedAt: invite.respondedAt,
      });

      const event = new InviteDeclinedEvent({
        inviteId: invite.id,
        userId: user.id,
        userName: user.name,
        associationId: association.id,
        associationName: association.name,
      });

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

    if (!invite || invite.associationId !== associationId) {
      throw new EntityNotFoundException('Convite não encontrado');
    }

    this.inviteDomainService.cancel(invite);

    await this.inviteRepository.update(inviteId, {
      status: invite.status,
      respondedAt: invite.respondedAt,
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

    const isExpired = this.inviteDomainService.isExpired(invite);

    return {
      id: invite.id,
      status: invite.status,
      message: invite.message,
      sentAt: invite.sentAt,
      expiresAt: invite.expiresAt,
      isExpired,
      association: invite.association,
      user: invite.user,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InviteCreatedEvent } from '@/events/invite-created.event';
import { InviteAcceptedEvent } from '@/events/invite-accepted.event';
import { InviteDeclinedEvent } from '@/events/invite-declined.event';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { INVITE_EXPIRATION_DAYS } from '@/common/constants/business-rules.constants';
import { InviteStatus, InviteAction } from '@/domain/enums/enums';
@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async validateInvitePrerequisites(
    associationId: number,
    userId: number,
  ) {
    const association = await this.prisma.association.findUnique({
      where: { id: associationId },
    });

    if (!association) {
      throw new EntityNotFoundException('Associação não encontrada');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, associationId: true },
    });

    if (!user) {
      throw new EntityNotFoundException('Usuário não encontrado');
    }

    if (user.associationId === associationId) {
      throw new BusinessException(
        'Usuário já está vinculado a esta associação',
      );
    }

    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        associationId,
        userId,
        status: InviteStatus.PENDING,
      },
    });

    if (existingInvite) {
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

    const invite = await this.prisma.invite.create({
      data: {
        associationId,
        userId: dto.userId,
        message: dto.message,
        expiresAt,
        status: InviteStatus.PENDING,
      },
      include: {
        user: true,
        association: true,
      },
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
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        user: true,
        association: true,
      },
    });

    if (!invite) {
      throw new EntityNotFoundException('Convite não encontrado');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BusinessException(
        `Convite já foi ${invite.status.toLowerCase()}`,
      );
    }

    if (new Date() > invite.expiresAt) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.EXPIRED },
      });
      throw new BusinessException('Convite expirado');
    }

    if (response === InviteAction.ACCEPT) {
      await this.prisma.$transaction([
        this.prisma.invite.update({
          where: { id: invite.id },
          data: {
            status: InviteStatus.ACCEPTED,
            respondedAt: new Date(),
          },
        }),
        this.prisma.user.update({
          where: { id: invite.userId },
          data: { associationId: invite.associationId },
        }),
      ]);

      const event = new InviteAcceptedEvent(
        invite.id,
        invite.user.id,
        invite.user.name,
        invite.association.id,
        invite.association.name,
      );

      this.eventEmitter.emit('invite.accepted', event);

      return {
        message: `Você agora faz parte da ${invite.association.name}!`,
        associationId: invite.associationId,
        associationName: invite.association.name,
      };
    } else {
      // Implicitamente é DECLINE, pois o Controller/DTO deve validar o Enum
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: {
          status: InviteStatus.DECLINED,
          respondedAt: new Date(),
        },
      });

      const event = new InviteDeclinedEvent(
        invite.id,
        invite.user.id,
        invite.user.name,
        invite.association.id,
        invite.association.name,
      );

      this.eventEmitter.emit('invite.declined', event);

      return {
        message: 'Convite recusado',
      };
    }
  }

  async getUserPendingInvites(userId: number) {
    return this.prisma.invite.findMany({
      where: {
        userId,
        status: InviteStatus.PENDING,
        expiresAt: { gte: new Date() },
      },
      include: {
        association: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            coverageArea: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  async getAssociationInvites(associationId: number, status?: InviteStatus) {
    const where: Prisma.InviteWhereInput = {
      associationId,
      ...(status && { status }),
    };

    return this.prisma.invite.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  async cancelInvite(associationId: number, inviteId: number) {
    const invite = await this.prisma.invite.findFirst({
      where: {
        id: inviteId,
        associationId,
        status: InviteStatus.PENDING,
      },
    });

    if (!invite) {
      throw new EntityNotFoundException(
        'Convite não encontrado ou já foi respondido',
      );
    }

    await this.prisma.invite.update({
      where: { id: inviteId },
      data: {
        status: InviteStatus.CANCELED,
        respondedAt: new Date(),
      },
    });

    return { message: 'Convite cancelado com sucesso' };
  }

  async getInviteByToken(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        association: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            coverageArea: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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
      association: invite.association,
      user: invite.user,
    };
  }
}

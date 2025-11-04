import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InviteCreatedEvent } from '@/events/invite-created.event';
import { InviteAcceptedEvent } from '@/events/invite-accepted.event';
import { InviteDeclinedEvent } from '@/events/invite-declined.event';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { InviteStatus } from '@/application/enums/invite-status.enum';

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Associação envia convite para um usuário
   * @param associationId ID da associação que está enviando o convite
   * @param dto Dados do convite (userId e mensagem opcional)
   * @returns Dados do convite criado
   */
  async createInvite(associationId: number, dto: CreateInviteDto) {
    // 1. Validar se associação existe
    const association = await this.prisma.association.findUnique({
      where: { id: associationId },
    });

    if (!association) {
      throw new NotFoundException('Associação não encontrada');
    }

    // 2. Validar se usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 3. Validar se usuário já está vinculado a esta associação
    if (user.associationId === associationId) {
      throw new ConflictException(
        'Usuário já está vinculado a esta associação',
      );
    }

    // 4. Validar se já existe convite PENDING
    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        associationId,
        userId: dto.userId,
        status: InviteStatus.PENDING,
      },
    });

    if (existingInvite) {
      throw new ConflictException(
        'Já existe um convite pendente para este usuário',
      );
    }

    // 5. Criar convite (expira em 7 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

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

    // 6. Emitir evento (para enviar email e notificação in-app)
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
   * @param token Token único do convite
   * @param response 'accept' ou 'decline'
   * @returns Resultado da resposta
   */
  async respondToInvite(token: string, response: 'accept' | 'decline') {
    // 1. Buscar convite pelo token
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        user: true,
        association: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Convite não encontrado');
    }

    // 2. Validar se convite já foi respondido
    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException(
        `Convite já foi ${invite.status.toLowerCase()}`,
      );
    }

    // 3. Validar se convite expirou
    if (new Date() > invite.expiresAt) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.EXPIRED },
      });
      throw new BadRequestException('Convite expirado');
    }

    // 4. Processar resposta
    if (response === 'accept') {
      // 4a. Aceitar: vincular usuário à associação
      await this.prisma.$transaction([
        // Atualizar status do convite
        this.prisma.invite.update({
          where: { id: invite.id },
          data: {
            status: InviteStatus.ACCEPTED,
            respondedAt: new Date(),
          },
        }),
        // Vincular usuário à associação
        this.prisma.user.update({
          where: { id: invite.userId },
          data: { associationId: invite.associationId },
        }),
      ]);

      // Emitir evento
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
      // 4b. Recusar: apenas atualizar status
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: {
          status: InviteStatus.DECLINED,
          respondedAt: new Date(),
        },
      });

      // Emitir evento
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

  /**
   * Listar convites pendentes de um usuário
   * @param userId ID do usuário
   * @returns Lista de convites pendentes não expirados
   */
  async getUserPendingInvites(userId: number) {
    return this.prisma.invite.findMany({
      where: {
        userId,
        status: InviteStatus.PENDING,
        expiresAt: { gte: new Date() }, // Não expirados
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

  /**
   * Listar convites enviados por uma associação
   * @param associationId ID da associação
   * @param status Filtro opcional por status
   * @returns Lista de convites
   */
  async getAssociationInvites(associationId: number, status?: string) {
    return this.prisma.invite.findMany({
      where: {
        associationId,
        ...(status && { status: status as InviteStatus }),
      },
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

  /**
   * Cancelar convite pendente (apenas associação pode cancelar)
   * @param associationId ID da associação
   * @param inviteId ID do convite
   * @returns Confirmação de cancelamento
   */
  async cancelInvite(associationId: number, inviteId: number) {
    const invite = await this.prisma.invite.findFirst({
      where: {
        id: inviteId,
        associationId,
        status: InviteStatus.PENDING,
      },
    });

    if (!invite) {
      throw new NotFoundException(
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

  /**
   * Buscar convite pelo token (para visualização antes de responder)
   * @param token Token único do convite
   * @returns Dados do convite
   */
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
      throw new NotFoundException('Convite não encontrado');
    }

    // Verificar se expirado
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

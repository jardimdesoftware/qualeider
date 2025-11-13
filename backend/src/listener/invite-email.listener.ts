import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '@/mail/mail.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { InviteCreatedEvent } from '@/events/invite-created.event';
import { InviteAcceptedEvent } from '@/events/invite-accepted.event';
import { InviteDeclinedEvent } from '@/events/invite-declined.event';

@Injectable()
export class InviteEmailListener {
  private readonly logger = new Logger(InviteEmailListener.name);
  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Quando convite é criado, envia email para o usuário convidado
   */
  @OnEvent('invite.created')
  async handleInviteCreated(event: InviteCreatedEvent) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const acceptUrl = `${frontendUrl}/invites/${event.token}?action=accept`;
    const declineUrl = `${frontendUrl}/invites/${event.token}?action=decline`;

    try {
      this.logger.log(`Enviando email de convite para ${event.userEmail}...`);

      await this.mailService.sendInviteEmail(
        event.userEmail,
        event.userName,
        event.associationName,
        event.message,
        acceptUrl,
        declineUrl,
        event.expiresAt,
      );

      this.logger.log(
        `Email de convite enviado com sucesso para ${event.userEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar email de convite para ${event.userEmail}:`,
        error,
      );
    }
  }

  /**
   * Quando convite é aceito, notifica a associação
   */
  @OnEvent('invite.accepted')
  async handleInviteAccepted(event: InviteAcceptedEvent) {
    this.logger.log(
      `✅ Convite #${event.inviteId} aceito: ${event.userName} agora faz parte da ${event.associationName}`,
    );

    try {
      // Buscar email da associação
      const association = await this.prisma.association.findUnique({
        where: { id: event.associationId },
        select: { email: true, name: true },
      });

      if (association) {
        this.logger.log(
          `Enviando notificação de aceite para ${association.email}...`,
        );

        await this.mailService.sendInviteAcceptedNotification(
          association.email,
          association.name,
          event.userName,
          event.userId,
        );

        this.logger.log(
          `Notificação de aceite enviada para ${association.email}`,
        );
      }
    } catch (error) {
      this.logger.error('❌ Erro ao notificar associação sobre aceite:', error);
    }
  }

  /**
   * Quando convite é recusado, notifica a associação
   */
  @OnEvent('invite.declined')
  async handleInviteDeclined(event: InviteDeclinedEvent) {
    this.logger.log(
      `Convite #${event.inviteId} recusado: ${event.userName} recusou o convite da ${event.associationName}`,
    );

    try {
      const association = await this.prisma.association.findUnique({
        where: { id: event.associationId },
        select: { email: true, name: true },
      });

      if (association) {
        this.logger.log(
          ` Enviando notificação de recusa para ${association.email}...`,
        );

        await this.mailService.sendInviteDeclinedNotification(
          association.email,
          association.name,
          event.userName,
        );

        this.logger.log(
          `Notificação de recusa enviada para ${association.email}`,
        );
      }
    } catch (error) {
      this.logger.error('Erro ao notificar associação sobre recusa:', error);
      // Não lançar erro para não quebrar o fluxo
    }
  }
}

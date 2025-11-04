import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendResetPasswordEmail(
    to: string,
    resetToken: string,
    userName: string,
    metadata?: {
      expiryDate?: Date;
      location?: string;
      device?: string;
      browser?: string;
      ipAddress?: string;
    },
  ) {
    const expiryDateStr = metadata?.expiryDate
      ? metadata.expiryDate.toLocaleString('pt-BR', {
          timeZone: 'UTC',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        })
      : null;

    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Seu código de redefinição de senha',
        template: 'reset-password',
        context: {
          userName,
          resetToken,
          expiryDateStr,
          metadata,
        },
      });
      console.log('E-mail de redefinição de senha enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar e-mail de redefinição de senha:', error);
      throw error;
    }
  }

  /**
   * Envia email de convite para usuário se juntar à associação
   */
  async sendInviteEmail(
    to: string,
    userName: string,
    associationName: string,
    customMessage: string | null,
    acceptUrl: string,
    declineUrl: string,
    expiresAt: Date,
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject: `Convite para fazer parte da ${associationName}`,
        template: 'invite',
        context: {
          userName,
          associationName,
          customMessage,
          acceptUrl,
          declineUrl,
          expiresAt: expiresAt.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
        },
      });
      console.log(`✅ Email de convite enviado para ${to}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar email de convite para ${to}:`, error);
      throw error;
    }
  }

  /**
   * Notifica associação que convite foi aceito
   */
  async sendInviteAcceptedNotification(
    to: string,
    associationName: string,
    userName: string,
    userId: number,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const userProfileUrl = `${frontendUrl}/association/members/${userId}`;

    try {
      await this.mailerService.sendMail({
        to,
        subject: `${userName} aceitou seu convite!`,
        template: 'invite-accepted',
        context: {
          associationName,
          userName,
          userProfileUrl,
        },
      });
      console.log(`✅ Notificação de aceite enviada para ${to}`);
    } catch (error) {
      console.error(
        `❌ Erro ao enviar notificação de aceite para ${to}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Notifica associação que convite foi recusado
   */
  async sendInviteDeclinedNotification(
    to: string,
    associationName: string,
    userName: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject: `${userName} recusou seu convite`,
        template: 'invite-declined',
        context: {
          associationName,
          userName,
        },
      });
      console.log(`✅ Notificação de recusa enviada para ${to}`);
    } catch (error) {
      console.error(
        `❌ Erro ao enviar notificação de recusa para ${to}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Envia notificação geral para produtores
   */
  async sendNotificationEmail(
    to: string,
    subject: string,
    message: string,
    userName: string,
    metadata?: {
      associationName?: string;
      senderName?: string;
      sentAt?: string;
      category?: string;
    },
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template: 'notification',
        context: {
          userName,
          subject,
          message,
          metadata,
        },
      });
      console.log(`E-mail enviado para ${to}`);
    } catch (error) {
      console.error(`Erro ao enviar e-mail para ${to}:`, error);
      throw error;
    }
  }
}

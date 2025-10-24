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
}

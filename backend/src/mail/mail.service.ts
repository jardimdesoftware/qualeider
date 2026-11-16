import { Injectable, Logger } from '@nestjs/common';
import { TemplateMailerService } from './template-mailer.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly mailerService: TemplateMailerService) {}

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
      this.logger.log('E-mail de redefinição de senha enviado com sucesso!');
    } catch (error) {
      this.logger.error(
        'Erro ao enviar e-mail de redefinição de senha:',
        error,
      );
      throw error;
    }
  }
}

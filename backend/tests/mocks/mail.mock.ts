import { Injectable, Logger } from '@nestjs/common';

/**
 * Mock do MailService para testes E2E
 * Simula envio de emails sem realmente conectar ao SMTP
 */
@Injectable()
export class MockMailService {
  private readonly logger = new Logger(MockMailService.name);

  // Armazena emails "enviados" para validação nos testes
  public sentEmails: Array<{
    to: string;
    subject: string;
    template: string;
    context: any;
  }> = [];

  async sendInviteEmail(
    to: string,
    associationName: string,
    inviteToken: string,
  ): Promise<void> {
    this.logger.log(`[MOCK] Email de convite enviado para ${to}`);

    this.sentEmails.push({
      to,
      subject: 'Convite para se juntar',
      template: 'invite',
      context: { associationName, inviteToken },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName: string,
  ): Promise<void> {
    this.logger.log(`[MOCK] Email de reset de senha enviado para ${to}`);

    this.sentEmails.push({
      to,
      subject: 'Recuperação de senha',
      template: 'password-reset',
      context: { resetToken, userName },
    });
  }

  // Alias para compatibilidade (mesmo método, nome diferente)
  async sendResetPasswordEmail(
    to: string,
    resetToken: string,
    userName: string,
  ): Promise<void> {
    return this.sendPasswordResetEmail(to, resetToken, userName);
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    this.logger.log(`[MOCK] Email de boas-vindas enviado para ${to}`);

    this.sentEmails.push({
      to,
      subject: 'Bem-vindo!',
      template: 'welcome',
      context: { userName },
    });
  }

  // Método auxiliar para limpar histórico entre testes
  clearSentEmails(): void {
    this.sentEmails = [];
  }

  // Método auxiliar para verificar se email foi enviado
  wasEmailSentTo(email: string): boolean {
    return this.sentEmails.some((sent) => sent.to === email);
  }

  // Método auxiliar para obter último email enviado
  getLastEmailSentTo(email: string) {
    return this.sentEmails.filter((sent) => sent.to === email).pop();
  }
}

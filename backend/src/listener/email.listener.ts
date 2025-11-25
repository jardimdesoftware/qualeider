import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '@/mail/mail.service';
import { NotificationSendPayload } from '@/events/notification-payload.interface';
import { IFailedEmailRepository } from '@/domain/repositories/failed-email.repository';
import { MAX_RETRIES, DELAY_MS } from '@/common/constants/email.constants';

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);
  constructor(
    private readonly mailService: MailService,
    private readonly failedEmailRepository: IFailedEmailRepository,
  ) {}

  @OnEvent('notification.send')
  async handleNotificationSend(payload: NotificationSendPayload) {
    await this.safeSendEmail(payload, 1);
  }

  private async safeSendEmail(
    payload: NotificationSendPayload,
    attempt: number,
  ) {
    try {
      this.logger.log(
        `Tentativa ${attempt} de enviar email para ${payload.to}...`,
      );

      await this.mailService.sendNotificationEmail(
        payload.to,
        payload.subject,
        payload.message,
        payload.userName,
        payload.metadata,
      );

      this.logger.log(
        `Email enviado com sucesso para ${payload.to} na tentativa ${attempt}.`,
      );
    } catch (error) {
      this.logger.error(
        `Erro na Tentativa ${attempt} para ${payload.to}:`,
        error,
      );

      if (attempt < MAX_RETRIES) {
        const delayTime = DELAY_MS * attempt; // 2s, 4s, 6s
        this.logger.log(
          `Aguardando ${delayTime}ms antes da próxima tentativa...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayTime));

        await this.safeSendEmail(payload, attempt + 1);
      } else {
        this.logger.error(
          `Falha final ao enviar email para ${payload.to} após ${MAX_RETRIES} tentativas. Salvando na DLQ...`,
        );

        try {
          await this.failedEmailRepository.create({
            payload: {
              to: payload.to,
              subject: payload.subject,
              template: 'notification',
              context: {
                userName: payload.userName,
                subject: payload.subject,
                message: payload.message,
                metadata: payload.metadata,
              },
            },
            errorReason: error instanceof Error ? error.message : String(error),
            retryCount: MAX_RETRIES,
          });
          this.logger.log(`Email falho salvo na DLQ com sucesso.`);
        } catch (dlqError) {
          this.logger.error(
            `CRÍTICO: Falha ao salvar email na DLQ!`,
            dlqError,
          );
        }
      }
    }
  }
}

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '@/mail/mail.service';
import { NotificationSendPayload } from '@/events/notification-payload.interface';

const MAX_RETRIES = 3;
const DELAY_MS = 2000; 

@Injectable()
export class EmailListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('notification.send')
  async handleNotificationSend(payload: NotificationSendPayload) {
    await this.safeSendEmail(payload, 1);
  }

  private async safeSendEmail(
    payload: NotificationSendPayload,
    attempt: number,
  ) {
    try {
      console.log(`Tentativa ${attempt} de enviar email para ${payload.to}...`);

      await this.mailService.sendNotificationEmail(
        payload.to,
        payload.subject,
        payload.message,
        payload.userName,
        payload.metadata,
      );

      console.log(
        `Email enviado com sucesso para ${payload.to} na tentativa ${attempt}.`,
      );
    } catch (error) {
      console.error(`Erro na Tentativa ${attempt} para ${payload.to}:`, error);

      if (attempt < MAX_RETRIES) {
        const delayTime = DELAY_MS * attempt; // 2s, 4s, 6s
        console.log(`Aguardando ${delayTime}ms antes da próxima tentativa...`);
        await new Promise((resolve) => setTimeout(resolve, delayTime));

        await this.safeSendEmail(payload, attempt + 1);
      } else {
        console.error(
          `Falha final ao enviar email para ${payload.to} após ${MAX_RETRIES} tentativas.`,
        );

        // TODO: Implementar DLQ (salvar payload no DB ou enviar para uma fila de processamento manual)
      }
    }
  }

  
}

/**
 * Interface para o payload do evento de notificação
 * Usado quando o evento 'notification.send' é emitido
 */
export interface NotificationSendPayload {
  to: string;
  subject: string;
  message: string;
  userName: string;
  metadata?: {
    associationName?: string;
    senderName?: string;
    sentAt?: string;
    category?: string;
  };
}

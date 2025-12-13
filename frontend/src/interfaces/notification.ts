export enum NotificationType {
  INDIVIDUAL = 'Individual',
  COLLECTIVE = 'Collective',
}

export interface SendNotificationPayload {
  type: NotificationType;
  associationId: number;
  userIds?: number[];
  subject: string;
  message: string;
  template?: string;
}

export interface NotificationResponse {
  statusCode: number;
  message: string;
  data: {
    count: number | string;
  };
}

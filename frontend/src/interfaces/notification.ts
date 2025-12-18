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

export interface UserNotification {
  id: number;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  notification: {
    id: number;
    associationId: number;
    subject: string;
    message: string;
    createdAt: string;
  };
}

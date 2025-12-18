import { apiBase } from "./baseApi";
import { SendNotificationPayload, NotificationResponse, UserNotification } from "@/interfaces/notification";

export const notificationService = {
  send: async (data: SendNotificationPayload): Promise<NotificationResponse> => {
    const { data: response } = await apiBase.post<NotificationResponse>("/notifications/send", data);
    return response;
  },

  getUserNotifications: async (): Promise<UserNotification[]> => {
    const { data } = await apiBase.get<UserNotification[]>("/notifications/user/me");
    return data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiBase.post(`/notifications/read/${id}`, {});
  },
};

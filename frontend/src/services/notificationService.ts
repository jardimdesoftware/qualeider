import { apiBase } from "./baseApi";
import { SendNotificationPayload, NotificationResponse } from "@/interfaces/notification";

export const notificationService = {
  /**
   * Send a notification to producers
   */
  send: async (data: SendNotificationPayload): Promise<NotificationResponse> => {
    const token = localStorage.getItem("authToken");
    const response = await apiBase.post<NotificationResponse>("/notifications/send", data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get notifications for the logged in user
   */
  getUserNotifications: async (): Promise<any[]> => {
    const token = localStorage.getItem("authToken");
    const response = await apiBase.get<any[]>("/notifications/user/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: number): Promise<void> => {
    const token = localStorage.getItem("authToken");
    await apiBase.post(`/notifications/read/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

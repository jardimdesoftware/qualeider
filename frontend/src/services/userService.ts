import { apiBase } from "./baseApi";
import { User } from "@/interfaces/user";

export const userService = {
  /**
   * Get user by ID
   */
  getById: async (userId: string | number): Promise<User> => {
    const token = localStorage.getItem("authToken");
    const response = await apiBase.get<User>(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Update user data
   */
  update: async (userId: number, data: any) => {
    const token = localStorage.getItem("authToken");
    const response = await apiBase.put(`/users/${userId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

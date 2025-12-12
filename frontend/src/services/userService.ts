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

  /**
   * Check if email already exists
   */
  checkEmail: async (email: string): Promise<boolean> => {
    const { data } = await apiBase.get<{ exists: boolean }>(
      "/users/check-email",
      { params: { email } }
    );
    return data.exists;
  },

  /**
   * Get all users (with optional filters)
   */
  findAll: async (params?: any, signal?: AbortSignal): Promise<User[]> => {
    const { data } = await apiBase.get<User[]>("/users", {
      params,
      signal,
    });
    return data;
  },
};

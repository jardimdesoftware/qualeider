import { apiBase } from "./baseApi";
import { User } from "@/interfaces/user";

export const userService = {
  getById: async (userId: string | number): Promise<User> => {
    const { data } = await apiBase.get<User>(`/users/${userId}`);
    return data;
  },

  update: async (userId: number, userData: Partial<User>) => {
    const { data } = await apiBase.put(`/users/${userId}`, userData);
    return data;
  },

  checkEmail: async (email: string): Promise<boolean> => {
    const { data } = await apiBase.get<{ exists: boolean }>(
      "/users/check-email",
      { params: { email } }
    );
    return data.exists;
  },

  findAll: async (params?: Record<string, unknown>, signal?: AbortSignal): Promise<User[]> => {
    const { data } = await apiBase.get("/users", {
      params,
      signal,
    });
    return data;
  },
};

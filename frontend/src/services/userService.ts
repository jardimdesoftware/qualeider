import { apiBase } from "./baseApi";
import { User, CreateUserDto } from "@/interfaces/user";

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

  findAll: async (
    params?: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<PaginatedUsers> => {
    const { data } = await apiBase.get<PaginatedUsers>("/users", {
      params,
      signal,
    });
    return data;
  },

  /**
   * Cria um funcionário internamente (Admin → Vaqueiro ou Admin adicional).
   * Chama o endpoint autenticado POST /users/internal.
   */
  createInternal: async (userData: CreateUserDto): Promise<User> => {
    const { data } = await apiBase.post<User>("/users/internal", userData);
    return data;
  },
};

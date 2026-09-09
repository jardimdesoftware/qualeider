import { apiBase } from "./baseApi";

export interface AllowedEmail {
  id: number;
  email: string;
  createdAt: string;
}

export const allowedEmailsService = {
  findAll: async (): Promise<AllowedEmail[]> => {
    const { data } = await apiBase.get<AllowedEmail[]>("/allowed-emails");
    return data;
  },

  create: async (email: string): Promise<AllowedEmail> => {
    const { data } = await apiBase.post<AllowedEmail>("/allowed-emails", {
      email,
    });
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await apiBase.delete(`/allowed-emails/${id}`);
  },
};

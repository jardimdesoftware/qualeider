import { apiBase } from "./baseApi";
import { Animal } from "@/interfaces/animal";

export const animalService = {
  getByUser: async (userId: number): Promise<Animal[]> => {
    const token = localStorage.getItem("authToken");
    const response = await apiBase.get(`/animals/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Animal> => {
    const token = localStorage.getItem("authToken");
    const response = await apiBase.get(`/animals/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  create: async (data: any, userId: number) => {
    const token = localStorage.getItem("authToken");
    const response = await apiBase.post("/animals", { ...data, userId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const token = localStorage.getItem("authToken");
    const response = await apiBase.put(`/animals/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  delete: async (id: number) => {
    const token = localStorage.getItem("authToken");
    const response = await apiBase.delete(`/animals/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

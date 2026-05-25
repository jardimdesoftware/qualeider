import { apiBase } from "./baseApi";
import { DailyCollectionData } from "@/schemas/collection";

export const collectionService = {
  create: async (data: DailyCollectionData, userId: number) => {
    const payload = { ...data, userId };
    const { data: response } = await apiBase.post("/daily-collections", payload);
    return response;
  },

  getByUser: async (userId: number) => {
    const { data } = await apiBase.get(`/daily-collections/user/${userId}`);
    return data;
  },

  update: async (id: number, data: Partial<DailyCollectionData>) => {
    const { data: response } = await apiBase.put(`/daily-collections/${id}`, data);
    return response;
  },

  remove: async (id: number) => {
    const { data: response } = await apiBase.delete(`/daily-collections/${id}`);
    return response;
  },
};

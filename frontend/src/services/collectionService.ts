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
};

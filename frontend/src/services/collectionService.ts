import { apiBase } from "./baseApi";
import { DailyCollectionData } from "@/schemas/collection";

export const collectionService = {

  create: async (data: DailyCollectionData, userId: number) => {
    const token = localStorage.getItem("authToken");

    const payload = { ...data, userId };

    const response = await apiBase.post("/daily-collections", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  },

  getByUser: async (userId: number) => {
    const token = localStorage.getItem("authToken");
    const response = await apiBase.get(`/daily-collections/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

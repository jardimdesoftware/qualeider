import { apiBase } from "./baseApi";
import { Destination, CreateDestinationDto, UpdateDestinationDto } from "@/interfaces/destination";

export const destinationService = {
  getAll: async (): Promise<Destination[]> => {
    const { data } = await apiBase.get("/destinations");
    return data;
  },

  getById: async (id: number): Promise<Destination> => {
    const { data } = await apiBase.get(`/destinations/${id}`);
    return data;
  },

  create: async (payload: CreateDestinationDto): Promise<Destination> => {
    const { data } = await apiBase.post("/destinations", payload);
    return data;
  },

  update: async (id: number, payload: UpdateDestinationDto): Promise<Destination> => {
    const { data } = await apiBase.put(`/destinations/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiBase.delete(`/destinations/${id}`);
  },
};

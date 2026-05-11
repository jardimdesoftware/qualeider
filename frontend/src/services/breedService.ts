import { apiBase } from "./baseApi";
import { Breed, CreateBreedDto, UpdateBreedDto } from "@/interfaces/breed";

export const breedService = {
  getAll: async (): Promise<Breed[]> => {
    const { data } = await apiBase.get("/breeds");
    return data;
  },

  getById: async (id: number): Promise<Breed> => {
    const { data } = await apiBase.get(`/breeds/${id}`);
    return data;
  },

  create: async (payload: CreateBreedDto): Promise<Breed> => {
    const { data } = await apiBase.post("/breeds", payload);
    return data;
  },

  update: async (id: number, payload: UpdateBreedDto): Promise<Breed> => {
    const { data } = await apiBase.put(`/breeds/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiBase.delete(`/breeds/${id}`);
  },
};

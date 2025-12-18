import { apiBase } from "./baseApi";
import { Animal, CreateAnimalDto } from "@/interfaces/animal";

export const animalService = {
  getByUser: async (userId: number): Promise<Animal[]> => {
    const { data } = await apiBase.get(`/animals/user/${userId}`);
    return data;
  },

  getById: async (id: string | number): Promise<Animal> => {
    const { data } = await apiBase.get(`/animals/${id}`);
    return data;
  },

  create: async (animalData: Omit<CreateAnimalDto, 'userId'>, userId: number): Promise<Animal> => {
    const payload: CreateAnimalDto = { ...animalData, userId };
    const { data } = await apiBase.post("/animals", payload);
    return data;
  },

  update: async (id: number, animalData: Partial<CreateAnimalDto>): Promise<Animal> => {
    const { data } = await apiBase.put(`/animals/${id}`, animalData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiBase.delete(`/animals/${id}`);
  },
};

import { apiBase } from './baseApi';
import { AnimalSpecies, CreateAnimalSpeciesDto, UpdateAnimalSpeciesDto } from '@/interfaces/animalSpecies';

export const animalSpeciesService = {
  getAll: async (): Promise<AnimalSpecies[]> => {
    const { data } = await apiBase.get('/animal-species');
    return data;
  },

  getById: async (id: number): Promise<AnimalSpecies> => {
    const { data } = await apiBase.get(`/animal-species/${id}`);
    return data;
  },

  create: async (dto: CreateAnimalSpeciesDto): Promise<AnimalSpecies> => {
    const { data } = await apiBase.post('/animal-species', dto);
    return data;
  },

  update: async (id: number, dto: UpdateAnimalSpeciesDto): Promise<AnimalSpecies> => {
    const { data } = await apiBase.put(`/animal-species/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiBase.delete(`/animal-species/${id}`);
  },
};

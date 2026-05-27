export interface AnimalSpecies {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnimalSpeciesDto {
  name: string;
  description?: string;
}

export interface UpdateAnimalSpeciesDto {
  name?: string;
  description?: string;
}

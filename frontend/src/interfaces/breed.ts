export interface Breed {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateBreedDto = Pick<Breed, 'name' | 'description'>;
export type UpdateBreedDto = Partial<CreateBreedDto>;

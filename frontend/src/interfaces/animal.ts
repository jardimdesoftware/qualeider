import { AnimalSpecies } from './animalSpecies';

export enum AnimalType {
  Vaca = "Vaca",
  Cabra = "Cabra",
  Ovelha = "Ovelha",
  Bufala = "Bufala",
  Outro = "Outro",
}

export enum Status {
  Active = "Active",
  Inactive = "Inactive",
}

export interface Animal {
  id: number;
  name?: string;
  animalType?: AnimalType;       // legado — pode ser null em animais novos
  animalSpeciesId?: number | null;
  animalSpecies?: AnimalSpecies | null;
  breed?: string;
  breedId?: number | null;
  age: number;
  userId: number;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAnimalDto = Omit<
  Animal,
  "id" | "status" | "createdAt" | "updatedAt"
>;

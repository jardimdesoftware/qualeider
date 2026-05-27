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
  tagNumber?: string | null;       // número de identificação/brinco
  name?: string | null;
  animalType?: AnimalType | null;  // legado
  animalSpeciesId?: number | null;
  animalSpecies?: AnimalSpecies | null;
  breed?: string | null;
  breedId?: number | null;
  age: number;
  userId: number;
  status: Status;

  // Parentesco
  motherId?: number | null;
  mother?: Animal | null;
  motherCode?: string | null;
  fatherId?: number | null;
  father?: Animal | null;
  fatherCode?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export type CreateAnimalDto = Omit<
  Animal,
  "id" | "status" | "createdAt" | "updatedAt" | "mother" | "father" | "animalSpecies"
>;

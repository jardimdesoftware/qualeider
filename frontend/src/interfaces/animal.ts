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
  animalType: AnimalType;
  breed: string;
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

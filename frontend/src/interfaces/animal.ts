export interface Animal {
  id: number;
  name: string;
  animalType: string;
  breed: string;
  age: number;
  userId: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// no id/timestamps/status yet
export type CreateAnimal = Omit<
  Animal,
  "id" | "status" | "createdAt" | "updatedAt"
>;

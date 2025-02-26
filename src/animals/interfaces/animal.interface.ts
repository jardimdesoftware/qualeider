export enum AnimalType {
  Vaca = 'Vaca',
  Cabra = 'Cabra',
  Ovelha = 'Ovelha',
  Bufala = 'Bufala',
  Outro = 'Outro',
}

export interface IAnimal {
  id: number;
  name?: string;
  animalType: AnimalType;
  breed: string;
  age: number;
  status?: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}
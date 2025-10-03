export enum MilkingPlace {
  Aberto = 'Aberto',
  Curral = 'Curral',
  Ambos = 'Ambos',
}

export interface IDailyCollection {
  id: number;
  quantity: number;
  collectionDate: Date;
  userId: number;
  numAnimals: number;
  numOrdens: number;
  rationProvided: boolean;
  numLactation: number;
  milkingPlace: MilkingPlace;
  technicalAssistance: boolean;
  createdAt: Date;
  updatedAt: Date;
}
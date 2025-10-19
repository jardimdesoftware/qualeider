export enum MilkingPlace {
  Aberto = "Aberto",
  Curral = "Curral",
  Ambos = "Ambos",
}

export interface DailyCollection {
  id: number;
  quantity: number;
  collectionDate: string;
  userId: number;
  numAnimals: number;
  numOrdens: number;
  rationProvided: boolean;
  numLactation: number;
  milkingPlace: MilkingPlace;
  technicalAssistance: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type DailyCollectionCreate = Omit<
  DailyCollection,
  "id" | "createdAt" | "updatedAt"
>;

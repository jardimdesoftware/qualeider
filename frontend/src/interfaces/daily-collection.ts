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
  items?: {
    id: number;
    animalId: number;
    dailyCollectionId: number;
    quantity: number;
    animal?: {
      id: number;
      name: string;
    };
  }[];
}

export type DailyCollectionCreate = Omit<
  DailyCollection,
  "id" | "createdAt" | "updatedAt"
>;

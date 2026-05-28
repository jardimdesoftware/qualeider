export enum MilkingPlace {
  Aberto = "Aberto",
  Curral = "Curral",
  Ambos = "Ambos",
}

export enum CmtResult {
  Normal = "Normal",
  Suspeito = "Suspeito",
  Positivo = "Positivo",
}

export interface DailyCollectionItem {
  id: number;
  animalId: number;
  dailyCollectionId: number;
  quantity: number;
  cmtResult?: CmtResult | null;
  animal?: {
    id: number;
    name?: string | null;
    tagNumber?: string | null;
  };
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
  items?: DailyCollectionItem[];
}

export type DailyCollectionCreate = Omit<
  DailyCollection,
  "id" | "createdAt" | "updatedAt"
>;

export enum MilkingPlace {
  Aberto = "Aberto",
  Curral = "Curral",
  Ambos = "Ambos",
}

export enum MugTestResult {
  Negativo = "Negativo",
  Positivo = "Positivo",
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
  cmtResult?: CmtResult | null; // CMT (California Mastitis Test)
  mugTestResult?: MugTestResult | null; // teste da caneca
  milking?: number; // 1 = primeira ordenha, 2 = segunda
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
  destinationId?: number | null; // para onde o leite foi
  destination?: { id: number; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
  items?: DailyCollectionItem[];
}

export type DailyCollectionCreate = Omit<
  DailyCollection,
  "id" | "createdAt" | "updatedAt"
>;

export interface AnimalCollectionHistoryItem {
  collectionId: number;
  collectionDate: string;
  quantity: number;
  cmtResult?: CmtResult | null;
  mugTestResult?: MugTestResult | null;
  milking?: number;
}

export interface AssociateSummaryDto {
  id: number;
  name: string;
  farmName: string; // Placeholder or derived
  city: string;
  state: string;
  status: string;
  animalsCount: number;
  dailyProduction: number | null;
  lastAccess?: Date | null;
}

export interface RegionalHerdStatsDto {
  totalAnimals: number;
  totalMilkDay: number;
  avgProduction: number;
  heifers: number; // Novilhas
  calves: number;  // Bezerras
  lactatingCows: number;
  dryCows: number;
  breedDistribution: { name: string; value: number }[];
  productionHistory: { date: string; quantity: number }[];
}

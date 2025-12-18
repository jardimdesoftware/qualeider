export interface ProducerRanking {
  id: number;
  name: string;
  city?: string;
  state?: string;
  totalProduction: number;
  animalsCount: number;
  avgProductionPerDay: number;
  rank: number;
}

export interface MonthlyReport {
  month: string;
  totalProduction: number;
  totalProducers: number;
  averagePerProducer: number;
  totalAnimals: number;
  totalCollections: number;
  avgPerAnimal: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month';
}

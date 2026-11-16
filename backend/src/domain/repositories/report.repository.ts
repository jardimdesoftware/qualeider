import { HerdScope } from '@/domain/utils/herd-scope.util';

export const IReportRepository = Symbol('IReportRepository');

export interface MonthlyReport {
  month: string;
  totalProduction: number;
  totalProducers: number;
  averagePerProducer: number;
  totalAnimals: number;
  totalCollections: number;
  avgPerAnimal: number;
}

export interface IReportRepository {
  getMonthlyReport(scope: HerdScope, year: number, month: number): Promise<MonthlyReport>;
}

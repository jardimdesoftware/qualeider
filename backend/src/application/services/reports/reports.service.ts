import { Inject, Injectable } from '@nestjs/common';
import { IReportRepository } from '@/domain/repositories/report.repository';
import { HerdScope } from '@/domain/utils/herd-scope.util';

@Injectable()
export class ReportsService {
  constructor(@Inject(IReportRepository) private readonly reportRepository: IReportRepository) {}

  getMonthlyReport(scope: HerdScope, year: number, month: number) {
    return this.reportRepository.getMonthlyReport(scope, year, month);
  }
}

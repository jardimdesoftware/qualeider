import { ReportsService } from '@/application/services/reports/reports.service';
import { IReportRepository } from '@/domain/repositories/report.repository';
import { ReportsController } from '@/presentation/controllers/reports.controller';
import { UserRole } from '@/domain/enums/enums';

describe('Relatório mensal', () => {
  const monthly = {
    month: '10/2026',
    totalProduction: 25,
    totalProducers: 1,
    averagePerProducer: 25,
    totalAnimals: 2,
    totalCollections: 2,
    avgPerAnimal: 12.5,
  };
  let repository: jest.Mocked<IReportRepository>;
  let service: ReportsService;

  beforeEach(() => {
    repository = { getMonthlyReport: jest.fn().mockResolvedValue(monthly) };
    service = new ReportsService(repository);
  });

  it('o serviço repassa o escopo, o ano e o mês ao repositório', async () => {
    const result = await service.getMonthlyReport({ adminGroupId: 1 }, 2026, 10);

    expect(repository.getMonthlyReport).toHaveBeenCalledWith({ adminGroupId: 1 }, 2026, 10);
    expect(result).toBe(monthly);
  });

  it('o controller usa o escopo de leitura de quem pede (admin: o próprio grupo)', async () => {
    const controller = new ReportsController(service);

    await controller.getMonthlyReport({ year: 2026, month: 10 }, { id: 1, role: UserRole.ADMIN, adminId: null });

    expect(repository.getMonthlyReport).toHaveBeenCalledWith({ adminGroupId: 1 }, 2026, 10);
  });

  it('o controller usa o grupo do admin para um vaqueiro vinculado', async () => {
    const controller = new ReportsController(service);

    await controller.getMonthlyReport({ year: 2026, month: 10 }, { id: 5, role: UserRole.VAQUEIRO, adminId: 1 });

    expect(repository.getMonthlyReport).toHaveBeenCalledWith({ adminGroupId: 1 }, 2026, 10);
  });
});

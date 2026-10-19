import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IReportRepository, MonthlyReport } from '@/domain/repositories/report.repository';
import { HerdScope } from '@/domain/utils/herd-scope.util';
import { herdScopeUserWhere } from '@/infrastructure/utils/herd-scope-where';

@Injectable()
export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sem cache de proposito: o relatorio precisa mostrar a coleta recem registrada
   * (tres agregacoes simples por escopo, nao compensa guardar).
   */
  async getMonthlyReport(scope: HerdScope, year: number, month: number): Promise<MonthlyReport> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const userWhere = herdScopeUserWhere(scope);

    const productionAgg = await this.prisma.dailyCollection.aggregate({
      _sum: { quantity: true },
      _count: { id: true },
      where: {
        user: userWhere,
        collectionDate: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const totalProduction = productionAgg._sum.quantity || 0;
    const totalCollections = productionAgg._count.id;

    const activeProducers = await this.prisma.user.count({
      where: {
        ...userWhere,
        dailyCollections: {
          some: { collectionDate: { gte: startOfMonth, lte: endOfMonth } },
        },
      },
    });

    const totalAnimals = await this.prisma.animal.count({
      where: { user: userWhere, status: 'Active' },
    });

    return {
      month: `${month.toString().padStart(2, '0')}/${year}`,
      totalProduction,
      totalProducers: activeProducers,
      averagePerProducer: activeProducers > 0 ? totalProduction / activeProducers : 0,
      totalAnimals,
      totalCollections,
      avgPerAnimal: totalAnimals > 0 ? totalProduction / totalAnimals : 0,
    };
  }
}

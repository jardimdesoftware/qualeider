import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { AssociationEntity } from '@/domain/entities/association.entity';
import { handlePrismaError, isPrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { BusinessException } from '@/common/exceptions/business.exception';
import { AssociationMapper } from '@/infrastructure/mappers/association.mapper';
import { Status as PrismaStatus } from '@prisma/client';

@Injectable()
export class PrismaAssociationRepository implements IAssociationRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(
    data: Omit<AssociationEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<AssociationEntity> {
    try {
      const created = await this.prisma.association.create({
        data: {
          ...data,
          foundationDate: data.foundationDate ? new Date(data.foundationDate) : null,
          status: PrismaStatus.Active, 
        },
      });
      return AssociationMapper.toDomain(created);
    } catch (error) {
      if (isPrismaError(error) && error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION) {
        const target = error.meta?.target as string[];
        
        if (target?.includes('cnpj')) {
          throw new BusinessException('CNPJ já cadastrado.');
        }
        if (target?.includes('email')) {
          throw new BusinessException('Email já cadastrado.');
        }
      }
      
      handlePrismaError(error);
    }
  }

  async findByEmail(email: string): Promise<AssociationEntity | null> {
    const rawAssociation = await this.prisma.association.findUnique({
      where: { email },
    });
    if (!rawAssociation) return null;
    return AssociationMapper.toDomain(rawAssociation);
  }

  async findByCnpj(cnpj: string): Promise<AssociationEntity | null> {
    const rawAssociation = await this.prisma.association.findUnique({
      where: { cnpj },
    });
    if (!rawAssociation) return null;
    return AssociationMapper.toDomain(rawAssociation);
  }

  async findById(id: number): Promise<AssociationEntity | null> {
    const rawAssociation = await this.prisma.association.findUnique({
      where: { id },
    });
    if (!rawAssociation) return null;
    return AssociationMapper.toDomain(rawAssociation);
  }

  async findAssociates(associationId: number, options: { page: number; limit: number }): Promise<{ data: any[]; total: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [total, associates] = await Promise.all([
        this.prisma.user.count({ where: { associationId } }),
        this.prisma.user.findMany({
            where: { associationId },
            skip,
            take: limit,
            include: {
                _count: {
                    select: { animals: true },
                },
                dailyCollections: {
                    orderBy: { collectionDate: 'desc' },
                    take: 1,
                },
            },
        })
    ]);

    const data = associates.map((associate) => ({
      id: associate.id,
      name: associate.name,
      city: associate.city,
      state: associate.state,
      status: associate.status,
      animalsCount: associate._count.animals,
      dailyProduction: associate.dailyCollections[0]?.quantity || null,
      lastAccess: associate.lastLogin,
    }));

    return { data, total };
  }

  async getHerdStats(associationId: number): Promise<any> {
    const cacheKey = `herd_stats:${associationId}`;
    
    // Tenta buscar do cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;
    
    // Se não tiver no cache, calcula
    const stats = await this.calculateHerdStats(associationId);
    
    // Salva no cache (TTL 5 minutos = 300 segundos)
    await this.cacheManager.set(cacheKey, stats, 300);
    
    return stats;
  }

  private async calculateHerdStats(associationId: number): Promise<any> {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const startOfToday = new Date(today.setHours(0,0,0,0));
    const endOfToday = new Date(today.setHours(23,59,59,999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Executar todas as queries em paralelo para reduzir latência
    const [
      // Query 1: Contagem de animais por categoria (age ranges) em uma única query
      animalStats,
      // Query 2: Total de vacas ativas
      totalCows,
      // Query 3: Produção de hoje
      todaysCollections,
      // Query 4: Distribuição de raças
      breeds,
      // Query 5: Histórico de produção (7 dias)
      history,
      // Query 6: Idade média
      ageAgg,
      // Query 7: Stats do mês (produção + ração)
      monthStats,
    ] = await Promise.all([
      // 1. Usar groupBy para contar animais por faixas etárias em uma query
      this.prisma.$queryRaw<Array<{category: string; count: bigint}>>`
        SELECT 
          CASE 
            WHEN age < 1 THEN 'calves'
            WHEN age >= 1 AND age < 2 THEN 'heifers'
            ELSE 'adult'
          END as category,
          COUNT(*)::int as count
        FROM "Animal"
        WHERE "userId" IN (
          SELECT id FROM "User" WHERE "associationId" = ${associationId}
        )
        AND status = 'Active'
        GROUP BY category
      `,
      // 2. Total de vacas
      this.prisma.animal.count({
        where: {
          user: { associationId },
          animalType: 'Vaca',
          status: 'Active'
        }
      }),
      // 3. Produção de hoje
      this.prisma.dailyCollection.aggregate({
        _sum: { quantity: true },
        where: {
          user: { associationId },
          collectionDate: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      }),
      // 4. Distribuição de raças
      this.prisma.animal.groupBy({
        by: ['breed'],
        where: { user: { associationId }, status: 'Active' },
        _count: { breed: true }
      }),
      // 5. Histórico de produção (7 dias)
      this.prisma.dailyCollection.groupBy({
        by: ['collectionDate'],
        where: {
          user: { associationId },
          collectionDate: { gte: sevenDaysAgo }
        },
        _sum: { quantity: true },
        orderBy: { collectionDate: 'asc' }
      }),
      // 6. Idade média
      this.prisma.animal.aggregate({
        _avg: { age: true },
        where: { user: { associationId }, status: 'Active' }
      }),
      // 7. Stats do mês (combinar múltiplas agregações em uma query)
      this.prisma.dailyCollection.aggregate({
        _sum: { numOrdens: true },
        _avg: { numLactation: true },
        _count: {
          _all: true,
          rationProvided: true, // conta onde rationProvided = true
        },
        where: {
          user: { associationId },
          collectionDate: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
    ]);

    // Processar resultados do groupBy de animais
    const animalStatsMap = new Map(
      animalStats.map(s => [s.category, Number(s.count)])
    );
    
    const totalAnimals = Array.from(animalStatsMap.values()).reduce((sum, count) => sum + count, 0);
    const calves = animalStatsMap.get('calves') || 0;
    const heifers = animalStatsMap.get('heifers') || 0;
    const adultCows = animalStatsMap.get('adult') || 0;

    // Calcular vacas em lactação (70% das adultas - simplificação)
    const lactatingCows = Math.floor(adultCows * 0.7);
    const dryCows = adultCows - lactatingCows;

    // Calcular média de produção
    const avgProduction = totalCows > 0 ? (todaysCollections._sum.quantity || 0) / totalCows : 0;

    // Formatar distribuição de raças
    const breedDistribution = breeds.map(b => ({ name: b.breed, value: b._count.breed }));

    // Formatar histórico
    const productionHistory = history.map(h => ({
      date: new Date(h.collectionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      quantity: h._sum.quantity || 0
    }));

    // Calcular % de ração fornecida
    const totalCollectionsMonth = monthStats._count._all;
    const rationCollectionsMonth = monthStats._count.rationProvided;
    const rationProvidedPercentage = totalCollectionsMonth > 0 
      ? (rationCollectionsMonth / totalCollectionsMonth) * 100 
      : 0;

    return {
      totalAnimals,
      totalMilkDay: todaysCollections._sum.quantity || 0,
      avgProduction,
      heifers,
      calves,
      lactatingCows,
      dryCows,
      breedDistribution,
      productionHistory,
      averageAnimalAge: ageAgg._avg.age || 0,
      rationProvidedPercentage,
      totalMilkingThisMonth: monthStats._sum.numOrdens || 0,
      averageLactationsThisMonth: monthStats._avg.numLactation || 0
    };
  }

  async getProducerRanking(associationId: number, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Criar cache key baseado nos parâmetros
    const start = startDate?.toISOString() || 'default';
    const end = endDate?.toISOString() || 'default';
    const cacheKey = `producer_ranking:${associationId}:${start}:${end}`;
    
    // Tenta buscar do cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached as any[];
    
    // Se não tiver no cache, calcula
    const ranking = await this.calculateProducerRanking(associationId, startDate, endDate);
    
    // Salva no cache (TTL 10 minutos = 600 segundos para rankings)
    await this.cacheManager.set(cacheKey, ranking, 600);
    
    return ranking;
  }

  private async calculateProducerRanking(associationId: number, startDate?: Date, endDate?: Date): Promise<any[]> {
    const end = endDate || new Date();
    const start = startDate || new Date();
    if (!startDate) {
      start.setDate(end.getDate() - 30);
    }

    const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // Query 1: Agregação de produção por usuário usando groupBy do Prisma
    const productionByUser = await this.prisma.dailyCollection.groupBy({
      by: ['userId'],
      where: {
        user: { associationId },
        collectionDate: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Query 2: Pegar dados básicos dos produtores + count de animais
    const producers = await this.prisma.user.findMany({
      where: { associationId },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        _count: {
          select: { animals: true },
        },
      },
    });

    // Mapear produção por userId para acesso O(1)
    const productionMap = new Map(
      productionByUser.map(p => [p.userId, p._sum.quantity || 0])
    );

    // Combinar dados e calcular métricas
    const producersWithMetrics = producers.map(producer => {
      const totalProduction = productionMap.get(producer.id) || 0;
      const avgProductionPerDay = totalProduction / daysDiff;

      return {
        id: producer.id,
        name: producer.name,
        city: producer.city,
        state: producer.state,
        totalProduction,
        animalsCount: producer._count.animals,
        avgProductionPerDay,
      };
    });

    // Ordenar e adicionar ranking
    const ranked = producersWithMetrics
      .sort((a, b) => b.totalProduction - a.totalProduction)
      .map((producer, index) => ({
        ...producer,
        rank: index + 1,
      }));

    return ranked;
  }

  async getMonthlyReport(associationId: number, year: number, month: number): Promise<any> {
    const cacheKey = `monthly_report:${associationId}:${year}:${month}`;
    
    // Tenta buscar do cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;
    
    // Se não tiver no cache, calcula
    const report = await this.calculateMonthlyReport(associationId, year, month);
    
    // Salva no cache (TTL 30 minutos = 1800 segundos para relatórios mensais)
    await this.cacheManager.set(cacheKey, report, 1800);
    
    return report;
  }

  private async calculateMonthlyReport(associationId: number, year: number, month: number): Promise<any> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const productionAgg = await this.prisma.dailyCollection.aggregate({
      _sum: { quantity: true },
      _count: { id: true },
      where: {
        user: { associationId },
        collectionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalProduction = productionAgg._sum.quantity || 0;
    const totalCollections = productionAgg._count.id;

    const activeProducers = await this.prisma.user.count({
      where: {
        associationId,
        dailyCollections: {
          some: {
            collectionDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        },
      },
    });

    const totalAnimals = await this.prisma.animal.count({
      where: {
        user: { associationId },
        status: 'Active',
      },
    });

    const averagePerProducer = activeProducers > 0 ? totalProduction / activeProducers : 0;
    const avgPerAnimal = totalAnimals > 0 ? totalProduction / totalAnimals : 0;

    return {
      month: `${month.toString().padStart(2, '0')}/${year}`,
      totalProduction,
      totalProducers: activeProducers,
      averagePerProducer,
      totalAnimals,
      totalCollections,
      avgPerAnimal,
    };
  }

  async findAvailableProducers(): Promise<any[]> {
    const producers = await this.prisma.user.findMany({
      where: {
        associationId: null,
      },
      select: {
          id: true,
          name: true,
          city: true,
          state: true,
      }
    });

    return producers.map(p => ({
        id: p.id,
        name: p.name,
        city: p.city,
        state: p.state,
    }));
  }

  async linkProducer(userId: number, associationId: number): Promise<void> {
      await this.prisma.user.update({
          where: { id: userId },
          data: { associationId }
      });
  }

  async update(id: number, data: Partial<AssociationEntity>): Promise<AssociationEntity> {
    const { ...updateData } = data;

    if (data.foundationDate) {
        (updateData as any).foundationDate = new Date(data.foundationDate);
    }

    try {
        const updated = await this.prisma.association.update({
            where: { id },
            data: updateData,
        });
        return AssociationMapper.toDomain(updated);
    } catch (error) {
         if (isPrismaError(error) && error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION) {
            const target = error.meta?.target as string[];
            
            if (target?.includes('cnpj')) {
              throw new BusinessException('CNPJ já cadastrado.');
            }
            if (target?.includes('email')) {
              throw new BusinessException('Email já cadastrado.');
            }
          }
        handlePrismaError(error);
    }
  }
}

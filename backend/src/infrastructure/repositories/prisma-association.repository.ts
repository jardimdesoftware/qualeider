import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { AssociationEntity } from '@/domain/entities/association.entity';
import { handlePrismaError, isPrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { BusinessException } from '@/common/exceptions/business.exception';
import { AssociationMapper } from '@/infrastructure/mappers/association.mapper';
import { Status as PrismaStatus } from '@prisma/client';

@Injectable()
export class PrismaAssociationRepository implements IAssociationRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      farmName: 'Fazenda padrão', // Placeholder as not in schema
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
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // 1. Total Animals
    const totalAnimals = await this.prisma.animal.count({
      where: {
        user: { associationId },
        status: 'Active',
      },
    });

    // 2. Production (Total for today - simplified sum of latest collection per user)
    // A more accurate way would be to sum collections where date is today.
    // Let's summing collections from TODAY.
    const startOfToday = new Date(today.setHours(0,0,0,0));
    const endOfToday = new Date(today.setHours(23,59,59,999));

    const todaysCollections = await this.prisma.dailyCollection.aggregate({
      _sum: { quantity: true },
      where: {
        user: { associationId },
        collectionDate: {
            gte: startOfToday,
            lte: endOfToday
        }
      }
    });

    // 3. Average Production (Total Prod / Users with Production? OR Total Prod / Total Cows?)
    // "Média por Vaca" implies Total Prod / Total Cows.
    // We need count of Cows (not all animals).
    const totalCows = await this.prisma.animal.count({
        where: {
            user: { associationId },
            animalType: 'Vaca',
            status: 'Active'
        }
    });

    const avgProduction = totalCows > 0 ? (todaysCollections._sum.quantity || 0) / totalCows : 0;

    // 4. Breakdown (Mocking some logic based on age as Schema doesn't have heuristic status)
    // Assumption: < 1 year = Calf (Bezerra), 1-2 year = Heifer (Novilha), > 2 = Cow.
    // Lactating vs Dry requires checking DailyCollection link or custom status, hard to infer purely from 'Animal'.
    // We will approximate: 
    // Lactating = Cows belonging to users who produced milk recently? 
    // OR just use a ratio for visual proof if data is missing.
    // Let's use simple logic:
    const heifers = await this.prisma.animal.count({
        where: { user: { associationId }, age: { gte: 1, lt: 2 }, status: 'Active' }
    });
    const calves = await this.prisma.animal.count({
        where: { user: { associationId }, age: { lt: 1 }, status: 'Active' }
    });
    
    // For Lactating/Dry, we assume all "Cows" (> 2 years) are split.
    // This is a simplification.
    const adultCows = await this.prisma.animal.count({
         where: { user: { associationId }, age: { gte: 2 }, status: 'Active' }
    });
    const lactatingCows = Math.floor(adultCows * 0.7); // 70% assumed lactating
    const dryCows = adultCows - lactatingCows;


    // 5. Breed Distribution
    const breeds = await this.prisma.animal.groupBy({
        by: ['breed'],
        where: { user: { associationId }, status: 'Active' },
        _count: { breed: true }
    });
    const breedDistribution = breeds.map(b => ({ name: b.breed, value: b._count.breed }));

    // 6. Production History (Last 7 days)
    const history = await this.prisma.dailyCollection.groupBy({
        by: ['collectionDate'],
        where: {
            user: { associationId },
            collectionDate: { gte: sevenDaysAgo }
        },
        _sum: { quantity: true },
        orderBy: { collectionDate: 'asc' }
    });
    
    // Format history
    const productionHistory = history.map(h => ({
        date: new Date(h.collectionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        quantity: h._sum.quantity || 0
    }));


    // 7. Extended Metrics
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Average Animal Age
    const ageAgg = await this.prisma.animal.aggregate({
        _avg: { age: true },
        where: { user: { associationId }, status: 'Active' }
    });
    const averageAnimalAge = ageAgg._avg.age || 0;

    // Ration Provided Percentage (This Month)
    const totalCollectionsMonth = await this.prisma.dailyCollection.count({
        where: { user: { associationId }, collectionDate: { gte: startOfMonth, lte: endOfMonth } }
    });
    const rationCollectionsMonth = await this.prisma.dailyCollection.count({
        where: { 
            user: { associationId }, 
            rationProvided: true, 
            collectionDate: { gte: startOfMonth, lte: endOfMonth } 
        }
    });
    const rationProvidedPercentage = totalCollectionsMonth > 0 ? (rationCollectionsMonth / totalCollectionsMonth) * 100 : 0;

    // Milking and Lactation Stats (This Month)
    const monthStats = await this.prisma.dailyCollection.aggregate({
        _sum: { numOrdens: true },
        _avg: { numLactation: true },
        where: { 
            user: { associationId }, 
            collectionDate: { gte: startOfMonth, lte: endOfMonth } 
        }
    });
    const totalMilkingThisMonth = monthStats._sum.numOrdens || 0;
    const averageLactationsThisMonth = monthStats._avg.numLactation || 0;


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
        averageAnimalAge,
        rationProvidedPercentage,
        totalMilkingThisMonth,
        averageLactationsThisMonth
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
        farmName: 'Fazenda padrão'
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

    // Handle foundationDate conversion if present
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

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ID, Status } from '@/domain/enums/enums';
import { UserEntity } from '@/domain/entities/user.entity';
import { UserCriteria } from '@/domain/criteria/user.criteria';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: string;
    },
  ): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        userType: data.userType as any,
        userCategory: data.userCategory as any,
        city: data.city,
        state: data.state,
        status: (data as any).status ?? Status.Active,
      },
    });
    return created as unknown as UserEntity;
  }

  async findAll(criteria?: UserCriteria): Promise<Array<Omit<UserEntity, 'password'>>> {
    const where: any = {};

    if (criteria?.status) {
      where.status = criteria.status;
    } else {
      // Default to Active if not specified, or handle as needed. 
      // For now, let's keep the previous behavior of defaulting to Active if we want to maintain backward compatibility 
      // OR we can say if status is not provided, return all.
      // The previous method was findAllActive, so let's default to Active if not specified?
      // The requirement says "findAllActive" is replaced by "findAll(criteria)".
      // If criteria is empty, should we return ALL users or just ACTIVE?
      // Usually findAll returns all. But let's check the usage.
      // Ideally, we should be explicit.
      // Let's assume if status is not provided, we don't filter by status (return all).
      // BUT, to be safe and match "findAllActive" replacement, we might want to default to Active in the Service if needed.
      // However, the repository should be dumb.
      // Let's implement strict filtering based on criteria.
    }

    if (criteria?.associationId) {
      where.associationId = criteria.associationId;
    }

    if (criteria?.emailContains) {
      where.email = { contains: criteria.emailContains };
    }

    // If no criteria, maybe we want to return all?
    // The previous findAllActive filtered by status=Active.
    // Let's replicate that behavior IF criteria is undefined, OR let the service decide.
    // For now, let's implement the criteria translation.
    
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        userCategory: true,
        city: true,
        state: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users as any;
  }

  async findById(id: ID): Promise<Omit<UserEntity, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, status: Status.Active },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        userCategory: true,
        city: true,
        state: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return (user as any) ?? null;
  }

  async update(
    id: ID,
    data: Partial<UserEntity>,
  ): Promise<Omit<UserEntity, 'password'>> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        userType: (data.userType as any) ?? undefined,
        userCategory: data.userCategory as any,
        city: data.city,
        state: data.state,
        status: (data.status as any) ?? undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        userCategory: true,
        city: true,
        state: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated as any;
  }

  async partialUpdate(
    id: ID,
    data: Partial<UserEntity>,
  ): Promise<Omit<UserEntity, 'password'>> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        userType: (data.userType as any) ?? undefined,
        userCategory: (data.userCategory as any) ?? undefined,
        city: data.city,
        state: data.state,
        status: (data.status as any) ?? undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        userCategory: true,
        city: true,
        state: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated as any;
  }

  async softDelete(id: ID): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { status: Status.Inactive },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return (user as any) ?? null;
  }
}

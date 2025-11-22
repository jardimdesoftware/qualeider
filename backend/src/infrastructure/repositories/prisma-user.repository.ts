import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  async findAll(
    criteria: UserCriteria = {},
  ): Promise<Array<Omit<UserEntity, 'password'>>> {
    const where: Prisma.UserWhereInput = {};

    where.status = criteria.status !== undefined ? criteria.status : Status.Active;

    if (criteria.associationId) {
      where.associationId = criteria.associationId;
    }

    if (criteria.emailContains) {
      where.email = { contains: criteria.emailContains };
    }

    const include: Prisma.UserInclude = {};

    if (criteria.includeAnimals) {
      include.animals = true;
    }

    if (criteria.includeAssociation) {
      include.association = true;
    }

    const users = await this.prisma.user.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { createdAt: 'desc' },
    });

    // O Typecast é necessário pois o retorno do Prisma é dinâmico
    return users as unknown as Array<Omit<UserEntity, 'password'>>;
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

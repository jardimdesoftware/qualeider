import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ID, Status } from '@/domain/enums/enums';
import { UserEntity } from '@/domain/entities/user.entity';

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
        role: data.role as any,
        userType: data.userType as any,
        userCategory: data.userCategory as any,
        city: data.city,
        state: data.state,
        status: (data as any).status ?? Status.Active,
      },
    });
    return created as unknown as UserEntity;
  }

  async findAllActive(): Promise<Array<Omit<UserEntity, 'password'>>> {
    const users = await this.prisma.user.findMany({
      where: { status: Status.Active },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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
        role: true,
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
        role: data.role as any,
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
        role: true,
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
        role: (data.role as any) ?? undefined,
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
        role: true,
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

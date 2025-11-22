import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ID, Status } from '@/domain/enums/enums';
import { UserEntity } from '@/domain/entities/user.entity';
import { UserCriteria } from '@/domain/criteria/user.criteria';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: string;
    },
  ): Promise<UserEntity> {
    try {
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
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Email já está em uso.',
      });
    }
  }

  async findAll(
    criteria: UserCriteria = {},
  ): Promise<Array<Omit<UserEntity, 'password'>>> {
    const where: Prisma.UserWhereInput = {};

    // Lógica de Status Padrão
    where.status = criteria.status !== undefined ? criteria.status : Status.Active;

    if (criteria.associationId) {
      where.associationId = criteria.associationId;
    }

    if (criteria.emailContains) {
      where.email = { contains: criteria.emailContains }; 
    }

    const include: Prisma.UserInclude = {};

    if (criteria.includeAnimals) include.animals = true;
    if (criteria.includeAssociation) include.association = true;

    const users = await this.prisma.user.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return users as unknown as Array<Omit<UserEntity, 'password'>>;
  }

  // Note: Você precisará atualizar a assinatura na Interface IUserRepository também
  async findById(id: ID, options?: { includeAnimals?: boolean; includeAssociation?: boolean }): Promise<Omit<UserEntity, 'password'> | null> {
    
    const include: Prisma.UserInclude = {};
    if (options?.includeAnimals) include.animals = true;
    if (options?.includeAssociation) include.association = true;

    const user = await this.prisma.user.findUnique({
      where: { id, status: Status.Active },
      // Se tiver include, usa include. Se não, traz o padrão.
      include: Object.keys(include).length > 0 ? include : undefined,
    });
    
    return (user as any) ?? null;
  }

  async update(
    id: ID,
    data: Partial<UserEntity>,
  ): Promise<Omit<UserEntity, 'password'>> {
    return this.performUpdate(id, data);
  }

  async partialUpdate(
    id: ID,
    data: Partial<UserEntity>,
  ): Promise<Omit<UserEntity, 'password'>> {
    return this.performUpdate(id, data);
  }

  // Helper privado para evitar duplicação de código entre update e partialUpdate
  private async performUpdate(id: ID, data: Partial<UserEntity>) {
    try {
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
          password: data.password, 
        },
      });
      return updated as any;
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Email já cadastrado',
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Usuário com ID ${id} não encontrado para atualização.`,
      });
    }
  }

  async softDelete(id: ID): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { status: Status.Inactive },
      });
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Não foi possível remover. Usuário com ID ${id} não encontrado.`,
      });
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return (user as any) ?? null;
  }
}
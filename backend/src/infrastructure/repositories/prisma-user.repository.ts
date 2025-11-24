import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ID, Status } from '@/domain/enums/enums';
import { UserEntity } from '@/domain/entities/user.entity';
import { UserCriteria } from '@/domain/criteria/user.criteria';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import { 
  UserCategory as PrismaUserCategory, 
  UserType as PrismaUserType, 
  Status as PrismaStatus 
} from '@prisma/client';

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
          city: data.city,
          state: data.state,

          // Conversão segura de Enum Domínio -> Enum Prisma
          userType: data.userType as unknown as PrismaUserType,
          userCategory: data.userCategory as unknown as PrismaUserCategory,
          status: (data.status as unknown as PrismaStatus) ?? PrismaStatus.Active,
        },
      });
      return UserMapper.toDomain(created);
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

    where.status = criteria.status !== undefined 
      ? (criteria.status as unknown as PrismaStatus) 
      : PrismaStatus.Active;

    if (criteria.associationId) where.associationId = criteria.associationId;
    
    if (criteria.ids && criteria.ids.length > 0) where.id = { in: criteria.ids };

    if (criteria.emailContains) where.email = { contains: criteria.emailContains }; 

    const include: Prisma.UserInclude = {};
    if (criteria.includeAnimals) include.animals = true;
    if (criteria.includeAssociation) include.association = true;

    const rawUsers = await this.prisma.user.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return rawUsers.map((u) => UserMapper.toDomain(u));
  }

  async findById(
    id: ID, 
    options?: { includeAnimals?: boolean; includeAssociation?: boolean }
  ): Promise<Omit<UserEntity, 'password'> | null> {
    
    const include: Prisma.UserInclude = {};
    if (options?.includeAnimals) include.animals = true;
    if (options?.includeAssociation) include.association = true;

    const rawUser = await this.prisma.user.findUnique({
      where: { id, status: PrismaStatus.Active },
      include: Object.keys(include).length > 0 ? include : undefined,
    });
    
    if (!rawUser) return null;

    return UserMapper.toDomain(rawUser);
  }

  async update(id: ID, data: Partial<UserEntity>): Promise<Omit<UserEntity, 'password'>> {
    return this.performUpdate(id, data);
  }

  async partialUpdate(id: ID, data: Partial<UserEntity>): Promise<Omit<UserEntity, 'password'>> {
    return this.performUpdate(id, data);
  }

  private async performUpdate(id: ID, data: Partial<UserEntity>) {
    try {
      const updateData: Prisma.UserUpdateInput = {
        name: data.name,
        email: data.email,
        city: data.city,
        state: data.state,
        password: data.password, 
        resetToken: data.resetToken,
        resetTokenExpiry: data.resetTokenExpiry,
      };

      if (data.userType) updateData.userType = data.userType as unknown as PrismaUserType;
      if (data.userCategory) updateData.userCategory = data.userCategory as unknown as PrismaUserCategory;
      if (data.status) updateData.status = data.status as unknown as PrismaStatus;

      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
      
      return UserMapper.toDomain(updated);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Email já cadastrado',
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Usuário com ID ${id} não encontrado para atualização.`,
      });
    }
  }

  async softDelete(id: ID): Promise<UserEntity> {
    try {
      const deleted = await this.prisma.user.update({
        where: { id },
        data: { status: PrismaStatus.Inactive },
      });
      return UserMapper.toDomain(deleted);
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Não foi possível remover. Usuário com ID ${id} não encontrado.`,
      });
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const rawUser = await this.prisma.user.findUnique({ where: { email } });
    if (!rawUser) return null;
    return UserMapper.toDomain(rawUser);
  }
}
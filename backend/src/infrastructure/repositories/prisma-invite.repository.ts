import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  IInviteRepository,
  InviteFindOneOptions
} from '@/domain/repositories/invite.repository';
import { InviteCriteria } from '@/domain/criteria/invite.criteria';
import { InviteEntity } from '@/domain/entities/invite.entity';
import { InviteStatus } from '@/domain/enums/enums';
import { handlePrismaError, PrismaErrorCode } from '@/common/utils/prisma-error-handler';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaInviteRepository implements IInviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<InviteEntity> {
    try {
      const invite = await this.prisma.invite.create({
        data: {
          associationId: data.associationId,
          userId: data.userId,
          message: data.message,
          expiresAt: data.expiresAt,
          status: data.status ?? InviteStatus.PENDING,
        },
        include: {
          user: true,
          association: true,
        },
      });
      return invite as unknown as InviteEntity;
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Este usuário já possui um convite pendente ou ativo.',
      });
    }
  }

  async findAll(
    criteria: InviteCriteria = {}, 
    options: InviteFindOneOptions = {}
  ): Promise<InviteEntity[]> {
    const where: Prisma.InviteWhereInput = {};

    if (criteria.userId) where.userId = criteria.userId;
    if (criteria.associationId) where.associationId = criteria.associationId;
    if (criteria.status) where.status = criteria.status as any;
    if (criteria.token) where.token = criteria.token;
    
    if (criteria.expiresAfter) {
      where.expiresAt = { gte: criteria.expiresAfter };
    }

    const include: Prisma.InviteInclude = {};
    if (options.includeUser) include.user = true;
    if (options.includeAssociation) include.association = true;

    const invites = await this.prisma.invite.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { sentAt: 'desc' },
    });

    return invites as unknown as InviteEntity[];
  }

  async findById(
    id: number,
    options?: InviteFindOneOptions,
  ): Promise<InviteEntity | null> {
    const include: Prisma.InviteInclude = {};
    if (options?.includeUser) include.user = true;
    if (options?.includeAssociation) include.association = true;

    const invite = await this.prisma.invite.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    });

    return (invite as any) ?? null;
  }

  async findByToken(
    token: string,
    options?: InviteFindOneOptions,
  ): Promise<InviteEntity | null> {
    const include: Prisma.InviteInclude = {};
    if (options?.includeUser) include.user = true;
    if (options?.includeAssociation) include.association = true;

    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: Object.keys(include).length > 0 ? include : undefined,
    });

    return (invite as any) ?? null;
  }

  async update(id: number, data: any): Promise<InviteEntity> {
    try {
      const updated = await this.prisma.invite.update({
        where: { id },
        data: {
          status: data.status as any,
          respondedAt: data.respondedAt,
        },
        include: {
          user: true,
          association: true,
        },
      });
      return updated as unknown as InviteEntity;
    } catch (error) {
      handlePrismaError(error, {
        [PrismaErrorCode.RECORD_NOT_FOUND]: `Convite com ID ${id} não encontrado.`,
      });
    }
  }

  async expireOldInvites(): Promise<number> {
    try {
      const result = await this.prisma.invite.updateMany({
        where: {
          status: InviteStatus.PENDING,
          expiresAt: {
            lt: new Date(),
          },
        },
        data: {
          status: InviteStatus.EXPIRED as any,
        },
      });
      return result.count;
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

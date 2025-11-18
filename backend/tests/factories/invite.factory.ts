import { InviteStatus } from '@/domain/enums/enums';

/**
 * Interface para representar um Invite (baseado no schema Prisma)
 */
export interface InviteEntity {
  id: number;
  associationId: number;
  userId: number;
  token: string;
  message?: string | null;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  respondedAt?: Date | null;
  user?: any;
  association?: any;
}

/**
 * Factory para criar entidades Invite com dados válidos para testes
 */
export class InviteFactory {
  private static counter = 1;

  /**
   * Gera um token único para convite
   */
  private static generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Cria um InviteEntity completo com valores padrão
   * @param associationId - ID da associação que enviou o convite
   * @param userId - ID do usuário convidado
   * @param overrides - Campos para sobrescrever os valores padrão
   */
  static create(
    associationId: number,
    userId: number,
    overrides: Partial<InviteEntity> = {},
  ): InviteEntity {
    const id = InviteFactory.counter++;
    const timestamp = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

    return {
      id,
      associationId,
      userId,
      token: InviteFactory.generateToken(),
      message: null,
      status: InviteStatus.PENDING,
      expiresAt,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...overrides,
    };
  }

  /**
   * Cria um convite com mensagem personalizada
   */
  static createWithMessage(
    associationId: number,
    userId: number,
    message: string,
    overrides: Partial<InviteEntity> = {},
  ): InviteEntity {
    return InviteFactory.create(associationId, userId, {
      message,
      ...overrides,
    });
  }

  /**
   * Cria um convite aceito
   */
  static createAccepted(
    associationId: number,
    userId: number,
    overrides: Partial<InviteEntity> = {},
  ): InviteEntity {
    return InviteFactory.create(associationId, userId, {
      status: InviteStatus.ACCEPTED,
      ...overrides,
    });
  }

  /**
   * Cria um convite recusado
   */
  static createDeclined(
    associationId: number,
    userId: number,
    overrides: Partial<InviteEntity> = {},
  ): InviteEntity {
    return InviteFactory.create(associationId, userId, {
      status: InviteStatus.DECLINED,
      ...overrides,
    });
  }

  /**
   * Cria um convite expirado
   */
  static createExpired(
    associationId: number,
    userId: number,
    overrides: Partial<InviteEntity> = {},
  ): InviteEntity {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() - 1); // Expirou ontem

    return InviteFactory.create(associationId, userId, {
      expiresAt,
      ...overrides,
    });
  }

  /**
   * Cria um convite cancelado
   */
  static createCanceled(
    associationId: number,
    userId: number,
    overrides: Partial<InviteEntity> = {},
  ): InviteEntity {
    return InviteFactory.create(associationId, userId, {
      status: InviteStatus.CANCELED,
      ...overrides,
    });
  }

  /**
   * Cria múltiplos convites para a mesma associação
   */
  static createMany(
    associationId: number,
    userIds: number[],
    overrides: Partial<InviteEntity> = {},
  ): InviteEntity[] {
    return userIds.map((userId) =>
      InviteFactory.create(associationId, userId, overrides),
    );
  }

  /**
   * Reseta o contador de IDs
   */
  static resetCounter(): void {
    InviteFactory.counter = 1;
  }
}

// Helper functions for easier imports
export const createInvite = (
  overrides?: Partial<InviteEntity> & {
    associationId?: number;
    userId?: number;
  },
) => {
  const associationId = overrides?.associationId || 1;
  const userId = overrides?.userId || 1;
  return InviteFactory.create(associationId, userId, overrides);
};

export const createInviteWithMessage = (
  message: string,
  overrides?: Partial<InviteEntity> & {
    associationId?: number;
    userId?: number;
  },
) => {
  const associationId = overrides?.associationId || 1;
  const userId = overrides?.userId || 1;
  return InviteFactory.createWithMessage(
    associationId,
    userId,
    message,
    overrides,
  );
};

export const createAcceptedInvite = (
  overrides?: Partial<InviteEntity> & {
    associationId?: number;
    userId?: number;
  },
) => {
  const associationId = overrides?.associationId || 1;
  const userId = overrides?.userId || 1;
  return InviteFactory.createAccepted(associationId, userId, overrides);
};

export const createDeclinedInvite = (
  overrides?: Partial<InviteEntity> & {
    associationId?: number;
    userId?: number;
  },
) => {
  const associationId = overrides?.associationId || 1;
  const userId = overrides?.userId || 1;
  return InviteFactory.createDeclined(associationId, userId, overrides);
};

export const createExpiredInvite = (
  overrides?: Partial<InviteEntity> & {
    associationId?: number;
    userId?: number;
  },
) => {
  const associationId = overrides?.associationId || 1;
  const userId = overrides?.userId || 1;
  return InviteFactory.createExpired(associationId, userId, overrides);
};

export const createCanceledInvite = (
  overrides?: Partial<InviteEntity> & {
    associationId?: number;
    userId?: number;
  },
) => {
  const associationId = overrides?.associationId || 1;
  const userId = overrides?.userId || 1;
  return InviteFactory.createCanceled(associationId, userId, overrides);
};

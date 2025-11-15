/**
 * Mock completo do PrismaService para testes unitários
 * Fornece implementações mockadas dos modelos Prisma mais usados
 */

type MockedPrismaModel = {
  create: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  upsert?: jest.Mock;
  count?: jest.Mock;
  updateMany?: jest.Mock;
  deleteMany?: jest.Mock;
};

export type MockPrismaService = {
  user: MockedPrismaModel;
  animal: MockedPrismaModel;
  dailyCollection: MockedPrismaModel;
  association: MockedPrismaModel;
  invite: MockedPrismaModel;
  notification: MockedPrismaModel;
  $connect?: jest.Mock;
  $disconnect?: jest.Mock;
  $transaction?: jest.Mock;
};

export const createMockPrismaService = (): MockPrismaService => {
  return {
    // Modelo User
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },

    // Modelo Animal
    animal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // Modelo DailyCollection
    dailyCollection: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // Modelo Association
    association: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },

    // Modelo Invite
    invite: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },

    // Modelo Notification
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },

    // Métodos de transação
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  } as MockPrismaService;
};

/**
 * Helper para resetar todos os mocks do Prisma
 */
export const resetPrismaMocks = (prismaMock: MockPrismaService): void => {
  Object.keys(prismaMock).forEach((key) => {
    if (
      typeof (prismaMock as any)[key] === 'object' &&
      (prismaMock as any)[key] !== null
    ) {
      Object.keys((prismaMock as any)[key]).forEach((method) => {
        if (jest.isMockFunction((prismaMock as any)[key][method])) {
          ((prismaMock as any)[key][method] as jest.Mock).mockReset();
        }
      });
    } else if (jest.isMockFunction((prismaMock as any)[key])) {
      ((prismaMock as any)[key] as jest.Mock).mockReset();
    }
  });
};

/**
 * Mock de retorno padrão para operações de criação
 */
export const mockPrismaCreate = <T>(data: T): T => {
  return {
    ...data,
    id: Math.floor(Math.random() * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as T;
};

/**
 * Mock de retorno padrão para operações de atualização
 */
export const mockPrismaUpdate = <T>(existing: T, updates: Partial<T>): T => {
  return {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  } as T;
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Setup global para testes E2E
 * Limpa o banco de dados antes de cada suite de testes
 */
export async function setupE2ETests(): Promise<void> {
  await cleanDatabase();
}

/**
 * Teardown global para testes E2E
 * Limpa o banco de dados após todos os testes
 */
export async function teardownE2ETests(): Promise<void> {
  await cleanDatabase();
  await prisma.$disconnect();
}

/**
 * Limpa todas as tabelas do banco de dados
 */
async function safeDeleteMany(deleteFn: () => Promise<any>): Promise<void> {
  try {
    await deleteFn();
  } catch (error: any) {
    if (error?.code !== 'P2021') {
      throw error;
    }
  }
}

export async function cleanDatabase(): Promise<void> {
  try {
    await Promise.all([
      safeDeleteMany(() => prisma.dailyCollectionItem.deleteMany()),
      safeDeleteMany(() => prisma.notificationRecipient.deleteMany()),
    ]);

    await Promise.all([
      safeDeleteMany(() => prisma.dailyCollection.deleteMany()),
      safeDeleteMany(() => prisma.notification.deleteMany()),
    ]);

    await Promise.all([
      safeDeleteMany(() => prisma.animal.deleteMany()),
      safeDeleteMany(() => prisma.invite.deleteMany()),
    ]);

    await Promise.all([
      safeDeleteMany(() => prisma.user.deleteMany()),
      safeDeleteMany(() => prisma.association.deleteMany()),
    ]);
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
    throw error;
  }
}

export { prisma };

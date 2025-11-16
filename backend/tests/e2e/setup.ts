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
export async function cleanDatabase(): Promise<void> {
  try {
    await prisma.dailyCollection.deleteMany();

    await Promise.all([
      prisma.animal.deleteMany(),
      prisma.invite.deleteMany(),
      prisma.notification.deleteMany(),
    ]);

    await Promise.all([
      prisma.user.deleteMany(),
      prisma.association.deleteMany(),
    ]);
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
    throw error;
  }
}

export { prisma };

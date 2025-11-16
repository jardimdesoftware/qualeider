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
 * Mantém a ordem correta de deleção devido às foreign keys
 */
export async function cleanDatabase(): Promise<void> {
  try {
    // Desabilita foreign key checks temporariamente (PostgreSQL)
    await prisma.$executeRaw`SET session_replication_role = 'replica';`;

    // Ordem de deleção respeitando as foreign keys
    await prisma.$executeRaw`TRUNCATE TABLE "DailyCollection" CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "Animal" CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "Invite" CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "Notification" CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "Association" CASCADE;`;

    // Reabilita foreign key checks
    await prisma.$executeRaw`SET session_replication_role = 'origin';`;
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
    throw error;
  }
}

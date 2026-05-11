import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verifica se o banco de dados de teste está acessível.
 * Retorna false se o servidor/banco não existir (erro de conexão),
 * para que os testes possam ser pulados graciosamente em ambientes sem DB local.
 */
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$connect();
    return true;
  } catch (error: any) {
    // PrismaClientInitializationError — banco/servidor não acessível
    if (
      error?.constructor?.name === 'PrismaClientInitializationError' ||
      error?.code === 'P1001' || // can't reach server
      error?.code === 'P1003'    // database does not exist
    ) {
      console.warn(
        '\n⚠️  Banco de dados de teste não acessível — testes E2E pulados.\n' +
        '   Certifique-se de que o PostgreSQL está rodando localmente com o banco "qualeider_test".\n'
      );
      return false;
    }
    throw error;
  }
}

/**
 * Setup global para testes E2E
 * Limpa o banco de dados antes de cada suite de testes
 */
export async function setupE2ETests(): Promise<void> {
  const available = await isDatabaseAvailable();
  if (!available) return;
  await cleanDatabase();
}

/**
 * Teardown global para testes E2E
 * Limpa o banco de dados após todos os testes
 */
export async function teardownE2ETests(): Promise<void> {
  const available = await isDatabaseAvailable();
  if (available) {
    await cleanDatabase();
  }
  await prisma.$disconnect();
}

/**
 * Ignora erros de "tabela não existe" (P2021) e erros de conexão.
 * Propaga qualquer outro erro inesperado.
 */
async function safeDeleteMany(deleteFn: () => Promise<any>): Promise<void> {
  try {
    await deleteFn();
  } catch (error: any) {
    const isTableMissing = error?.code === 'P2021';
    const isConnectionError =
      error?.constructor?.name === 'PrismaClientInitializationError' ||
      error?.code === 'P1001' ||
      error?.code === 'P1003';

    if (!isTableMissing && !isConnectionError) {
      throw error;
    }
  }
}

export async function cleanDatabase(): Promise<void> {
  try {
    // 1ª ordem: tabelas dependentes (FK para collections/notifications)
    await Promise.all([
      safeDeleteMany(() => prisma.dailyCollectionItem.deleteMany()),
      safeDeleteMany(() => prisma.notificationRecipient.deleteMany()),
    ]);

    // 2ª ordem: collections e notifications
    await Promise.all([
      safeDeleteMany(() => prisma.dailyCollection.deleteMany()),
      safeDeleteMany(() => prisma.notification.deleteMany()),
    ]);

    // 3ª ordem: animais e convites (animal referencia breed via breedId)
    await Promise.all([
      safeDeleteMany(() => prisma.animal.deleteMany()),
      safeDeleteMany(() => prisma.invite.deleteMany()),
    ]);

    // 4ª ordem: raças, usuários e associações
    await Promise.all([
      safeDeleteMany(() => prisma.breed.deleteMany()),
      safeDeleteMany(() => prisma.user.deleteMany()),
      safeDeleteMany(() => prisma.association.deleteMany()),
    ]);
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
    throw error;
  }
}

export const E2E_TIMEOUT = 30000;

export { prisma };

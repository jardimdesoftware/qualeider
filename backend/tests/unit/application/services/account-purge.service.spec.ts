import { ConfigService } from '@nestjs/config';
import { AccountPurgeService } from '@/application/services/users/account-purge.service';
import { DefaultAccountsService } from '@/application/services/users/default-accounts.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

describe('AccountPurgeService (subida)', () => {
  let prisma: { oneOffTask: { findUnique: jest.Mock }; $transaction: jest.Mock };
  let defaults: { ensureDefaultAccounts: jest.Mock; getDefaultEmails: jest.Mock };
  let env: Record<string, string | undefined>;

  const build = () =>
    new AccountPurgeService(
      prisma as unknown as PrismaService,
      defaults as unknown as DefaultAccountsService,
      { get: (key: string) => env[key] } as unknown as ConfigService,
    );

  beforeEach(() => {
    env = { NODE_ENV: 'production' };
    prisma = { oneOffTask: { findUnique: jest.fn().mockResolvedValue(null) }, $transaction: jest.fn() };
    defaults = {
      ensureDefaultAccounts: jest.fn().mockResolvedValue(undefined),
      getDefaultEmails: jest.fn().mockReturnValue(['a@x.test', 'v@x.test']),
    };
  });

  it.each(['development', 'test', undefined])('não faz nada fora de produção (NODE_ENV=%s)', async (nodeEnv) => {
    env = { NODE_ENV: nodeEnv };
    await build().onApplicationBootstrap();
    expect(defaults.ensureDefaultAccounts).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('em produção garante as contas padrão e depois limpa', async () => {
    prisma.$transaction.mockResolvedValue({ status: 'done', usersRemoved: 3, associationsRemoved: 1 });
    await build().onApplicationBootstrap();
    expect(defaults.ensureDefaultAccounts).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('não limpa se as contas padrão estão desligadas', async () => {
    defaults.getDefaultEmails.mockReturnValue([]);
    const result = await build().purgeOnce();
    expect(result.status).toBe('skipped');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('não limpa de novo se já executou', async () => {
    prisma.oneOffTask.findUnique.mockResolvedValue({ name: 'x' });
    const result = await build().purgeOnce();
    expect(result).toEqual({ status: 'skipped', reason: 'ja executada antes' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('um erro na limpeza nunca derruba a subida da API', async () => {
    prisma.$transaction.mockRejectedValue(new Error('banco fora'));
    await expect(build().onApplicationBootstrap()).resolves.toBeUndefined();
  });
});

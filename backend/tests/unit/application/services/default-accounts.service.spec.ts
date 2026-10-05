import { ConfigService } from '@nestjs/config';
import { DefaultAccountsService } from '@/application/services/users/default-accounts.service';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { UserRole } from '@/domain/enums/enums';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';

describe('DefaultAccountsService', () => {
  let userRepository: jest.Mocked<Pick<IUserRepository, 'findByEmail' | 'create'>>;
  let hashService: jest.Mocked<Pick<IHashService, 'hash'>>;
  let env: Record<string, string | undefined>;

  const build = () =>
    new DefaultAccountsService(
      userRepository as unknown as IUserRepository,
      hashService as unknown as IHashService,
      { get: (key: string) => env[key] } as unknown as ConfigService,
    );

  beforeEach(() => {
    env = { NODE_ENV: 'test' };
    userRepository = { findByEmail: jest.fn().mockResolvedValue(null), create: jest.fn() };
    userRepository.create.mockImplementation(async (data: any) => ({ id: data.role === UserRole.ADMIN ? 1 : 2, ...data }) as any);
    hashService = { hash: jest.fn().mockResolvedValue('hashed') };
  });

  it('em NODE_ENV=test não cria nada sem as variáveis de ambiente', async () => {
    await build().ensureDefaultAccounts();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('fora de teste e sem variáveis, cria as contas de teste embutidas (admin e vaqueiro vinculado)', async () => {
    env = {};
    await build().ensureDefaultAccounts();

    expect(hashService.hash).toHaveBeenCalledWith('Teste@12345', BCRYPT_ROUNDS_USER_CREATION);
    expect(userRepository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ email: 'admin@qualeider.test', role: UserRole.ADMIN, name: 'Administrador de Teste' }),
    );
    expect(userRepository.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ email: 'vaqueiro@qualeider.test', role: UserRole.VAQUEIRO, adminId: 1 }),
    );
  });

  it('DEFAULT_ACCOUNTS_DISABLED=true desliga a criação das contas embutidas', async () => {
    env = { DEFAULT_ACCOUNTS_DISABLED: 'true' };
    await build().ensureDefaultAccounts();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('cria o ADMIN e o VAQUEIRO vinculado ao admin, com e-mail em minúsculas e senha com hash', async () => {
    env = {
      NODE_ENV: 'test',
      DEFAULT_ADMIN_EMAIL: ' Admin@Example.com ',
      DEFAULT_ADMIN_PASSWORD: 'Admin@12345',
      DEFAULT_ADMIN_NAME: 'Dono',
      DEFAULT_VAQUEIRO_EMAIL: 'vaq@example.com',
      DEFAULT_VAQUEIRO_PASSWORD: 'Vaq@12345',
    };
    await build().ensureDefaultAccounts();

    expect(hashService.hash).toHaveBeenCalledWith('Admin@12345', BCRYPT_ROUNDS_USER_CREATION);
    expect(userRepository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ email: 'admin@example.com', role: UserRole.ADMIN, name: 'Dono', password: 'hashed', adminId: undefined }),
    );
    expect(userRepository.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ email: 'vaq@example.com', role: UserRole.VAQUEIRO, name: 'Vaqueiro', adminId: 1 }),
    );
  });

  it('não toca em conta que já existe e liga o vaqueiro ao admin existente', async () => {
    env = {
      DEFAULT_ADMIN_EMAIL: 'admin@example.com',
      DEFAULT_ADMIN_PASSWORD: 'Admin@12345',
      DEFAULT_VAQUEIRO_EMAIL: 'vaq@example.com',
      DEFAULT_VAQUEIRO_PASSWORD: 'Vaq@12345',
    };
    userRepository.findByEmail.mockImplementation(async (email: string) =>
      email === 'admin@example.com' ? ({ id: 7, role: UserRole.ADMIN } as any) : null,
    );
    await build().ensureDefaultAccounts();

    expect(userRepository.create).toHaveBeenCalledTimes(1);
    expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.VAQUEIRO, adminId: 7 }));
  });

  it('rejeita senha fora da política e ignora o vaqueiro sem admin', async () => {
    env = {
      NODE_ENV: 'test',
      DEFAULT_ADMIN_EMAIL: 'admin@example.com',
      DEFAULT_ADMIN_PASSWORD: 'fraca',
      DEFAULT_VAQUEIRO_EMAIL: 'vaq@example.com',
      DEFAULT_VAQUEIRO_PASSWORD: 'Vaq@12345',
    };
    await build().ensureDefaultAccounts();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('não vincula o vaqueiro a um e-mail que não seja de ADMIN', async () => {
    env = {
      DEFAULT_ADMIN_EMAIL: 'admin@example.com',
      DEFAULT_ADMIN_PASSWORD: 'Admin@12345',
      DEFAULT_VAQUEIRO_EMAIL: 'vaq@example.com',
      DEFAULT_VAQUEIRO_PASSWORD: 'Vaq@12345',
    };
    userRepository.findByEmail.mockImplementation(async (email: string) =>
      email === 'admin@example.com' ? ({ id: 7, role: UserRole.VAQUEIRO } as any) : null,
    );
    await build().ensureDefaultAccounts();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('onApplicationBootstrap nunca propaga erro', async () => {
    env = { NODE_ENV: 'test', DEFAULT_ADMIN_EMAIL: 'admin@example.com', DEFAULT_ADMIN_PASSWORD: 'Admin@12345' };
    userRepository.findByEmail.mockRejectedValue(new Error('banco fora'));
    await expect(build().onApplicationBootstrap()).resolves.toBeUndefined();
  });
});

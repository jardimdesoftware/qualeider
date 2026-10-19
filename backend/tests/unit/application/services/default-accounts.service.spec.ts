import { ConfigService } from '@nestjs/config';
import { DefaultAccountsService } from '@/application/services/users/default-accounts.service';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { Status, UserRole } from '@/domain/enums/enums';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { BusinessException } from '@/common/exceptions/business.exception';

describe('DefaultAccountsService (admin fixo único)', () => {
  let userRepository: jest.Mocked<Pick<IUserRepository, 'findByEmail' | 'create' | 'update'>>;
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
    userRepository = { findByEmail: jest.fn().mockResolvedValue(null), create: jest.fn(), update: jest.fn() };
    userRepository.create.mockImplementation(async (data: any) => ({ id: 1, ...data }) as any);
    hashService = { hash: jest.fn().mockResolvedValue('hashed') };
  });

  it('em NODE_ENV=test não cria nada sem as variáveis de ambiente', async () => {
    await build().ensureDefaultAccounts();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('fora de teste e sem variáveis, cria o admin de teste embutido (e só ele)', async () => {
    env = {};
    await build().ensureDefaultAccounts();

    expect(hashService.hash).toHaveBeenCalledWith('Teste@12345', BCRYPT_ROUNDS_USER_CREATION);
    expect(userRepository.create).toHaveBeenCalledTimes(1);
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'admin@qualeider.test', role: UserRole.ADMIN, name: 'Administrador de Teste' }),
    );
  });

  it('DEFAULT_ACCOUNTS_DISABLED=true desliga a criação do admin embutido', async () => {
    env = { DEFAULT_ACCOUNTS_DISABLED: 'true' };
    await build().ensureDefaultAccounts();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('cria o ADMIN com e-mail em minúsculas, nome configurado e senha com hash', async () => {
    env = {
      NODE_ENV: 'test',
      DEFAULT_ADMIN_EMAIL: ' Admin@Example.com ',
      DEFAULT_ADMIN_PASSWORD: 'Admin@12345',
      DEFAULT_ADMIN_NAME: 'Dono',
    };
    await build().ensureDefaultAccounts();

    expect(hashService.hash).toHaveBeenCalledWith('Admin@12345', BCRYPT_ROUNDS_USER_CREATION);
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'admin@example.com', role: UserRole.ADMIN, name: 'Dono', password: 'hashed' }),
    );
  });

  it('não existe mais vaqueiro fixo: variáveis DEFAULT_VAQUEIRO_* são ignoradas', async () => {
    env = {
      NODE_ENV: 'test',
      DEFAULT_ADMIN_EMAIL: 'admin@example.com',
      DEFAULT_ADMIN_PASSWORD: 'Admin@12345',
      DEFAULT_VAQUEIRO_EMAIL: 'vaq@example.com',
      DEFAULT_VAQUEIRO_PASSWORD: 'Vaq@12345',
    };
    await build().ensureDefaultAccounts();

    expect(userRepository.create).toHaveBeenCalledTimes(1);
    expect(userRepository.create).not.toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.VAQUEIRO }));
  });

  it('não toca em conta que já existe', async () => {
    env = { NODE_ENV: 'test', DEFAULT_ADMIN_EMAIL: 'admin@example.com', DEFAULT_ADMIN_PASSWORD: 'Admin@12345' };
    userRepository.findByEmail.mockResolvedValue({ id: 7, role: UserRole.ADMIN, status: Status.Active } as any);

    await build().ensureDefaultAccounts();

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(hashService.hash).not.toHaveBeenCalled();
  });

  it('reativa o admin padrão inativo sem alterar senha nem perfil', async () => {
    env = { NODE_ENV: 'test', DEFAULT_ADMIN_EMAIL: 'admin@example.com', DEFAULT_ADMIN_PASSWORD: 'Admin@12345' };
    userRepository.findByEmail.mockResolvedValue({ id: 7, role: UserRole.ADMIN, status: Status.Inactive } as any);

    await build().ensureDefaultAccounts();

    expect(userRepository.update).toHaveBeenCalledTimes(1);
    expect(userRepository.update).toHaveBeenCalledWith(7, { status: Status.Active });
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(hashService.hash).not.toHaveBeenCalled();
  });

  it('rejeita senha fora da política', async () => {
    env = { NODE_ENV: 'test', DEFAULT_ADMIN_EMAIL: 'admin@example.com', DEFAULT_ADMIN_PASSWORD: 'fraca' };
    await build().ensureDefaultAccounts();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('onApplicationBootstrap nunca propaga erro', async () => {
    env = { NODE_ENV: 'test', DEFAULT_ADMIN_EMAIL: 'admin@example.com', DEFAULT_ADMIN_PASSWORD: 'Admin@12345' };
    userRepository.findByEmail.mockRejectedValue(new Error('banco fora'));
    await expect(build().onApplicationBootstrap()).resolves.toBeUndefined();
  });

  describe('getDefaultEmails', () => {
    it('devolve só o e-mail do admin em vigor', () => {
      env = { NODE_ENV: 'test', DEFAULT_ADMIN_EMAIL: ' Admin@Example.com ' };
      expect(build().getDefaultEmails()).toEqual(['admin@example.com']);
    });

    it('vazio quando a criação está desligada', () => {
      env = { DEFAULT_ACCOUNTS_DISABLED: 'true' };
      expect(build().getDefaultEmails()).toEqual([]);
    });
  });

  describe('corrida na criação da conta', () => {
    const ADMIN_EMAIL = 'admin@example.com';

    beforeEach(() => {
      env = { DEFAULT_ADMIN_EMAIL: ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD: 'Admin@12345' };
    });

    it('duas chamadas simultâneas compartilham uma única execução e criam a conta uma só vez', async () => {
      const service = build();

      const first = service.ensureDefaultAccounts();
      const second = service.ensureDefaultAccounts();
      expect(second).toBe(first);
      await Promise.all([first, second]);

      expect(userRepository.create).toHaveBeenCalledTimes(1);
    });

    it('concluída a execução, uma nova chamada roda de novo (a promessa não fica guardada)', async () => {
      const service = build();

      await service.ensureDefaultAccounts();
      const lookupsAfterFirstRun = userRepository.findByEmail.mock.calls.length;
      await service.ensureDefaultAccounts();

      expect(userRepository.findByEmail.mock.calls.length).toBeGreaterThan(lookupsAfterFirstRun);
    });

    it('depois de uma execução que falhou, a chamada seguinte tenta de novo', async () => {
      userRepository.findByEmail.mockRejectedValueOnce(new Error('banco fora'));
      const service = build();

      await expect(service.ensureDefaultAccounts()).rejects.toThrow('banco fora');
      await expect(service.ensureDefaultAccounts()).resolves.toBeUndefined();
      expect(userRepository.create).toHaveBeenCalledTimes(1);
    });

    it('create com e-mail duplicado (outra instância criou antes) segue sem erro', async () => {
      let conflicted = false;
      userRepository.create.mockImplementation(async () => {
        conflicted = true;
        throw new BusinessException('Email já está em uso.');
      });
      userRepository.findByEmail.mockImplementation(async () =>
        conflicted ? ({ id: 7, role: UserRole.ADMIN, status: Status.Active } as any) : null,
      );

      await expect(build().ensureDefaultAccounts()).resolves.toBeUndefined();

      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('conta criada pela outra instância e inativa é reativada, sem trocar a senha', async () => {
      let conflicted = false;
      userRepository.create.mockImplementation(async () => {
        conflicted = true;
        throw new BusinessException('Email já está em uso.');
      });
      userRepository.findByEmail.mockImplementation(async () =>
        conflicted ? ({ id: 7, role: UserRole.ADMIN, status: Status.Inactive } as any) : null,
      );

      await build().ensureDefaultAccounts();

      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(userRepository.update).toHaveBeenCalledWith(7, { status: Status.Active });
    });

    it('create que falha sem a conta existir continua propagando o erro original', async () => {
      userRepository.create.mockRejectedValue(new Error('banco fora'));

      await expect(build().ensureDefaultAccounts()).rejects.toThrow('banco fora');
      expect(userRepository.create).toHaveBeenCalledTimes(1);
    });
  });
});

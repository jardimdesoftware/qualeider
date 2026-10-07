import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { UserCategory, UserRole, UserType } from '@/domain/enums/enums';
import { UserEntity } from '@/domain/entities/user.entity';

// Mesma politica de senha do cadastro (CreateUserDto).
const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/;

/**
 * Contas de TESTE embutidas de proposito (decisao do projeto: ambiente de
 * demonstracao/avaliacao). Qualquer `DEFAULT_*` no ambiente sobrescreve estes
 * valores; `DEFAULT_ACCOUNTS_DISABLED=true` desliga a criacao (use em producao
 * real). Em NODE_ENV=test nada e criado por padrao, para nao sujar a base dos
 * testes.
 */
const TEST_ACCOUNTS = {
  DEFAULT_ADMIN: { email: 'admin@qualeider.test', password: 'Teste@12345', name: 'Administrador de Teste' },
  DEFAULT_VAQUEIRO: { email: 'vaqueiro@qualeider.test', password: 'Teste@12345', name: 'Vaqueiro de Teste' },
} as const;

interface AccountSpec {
  role: UserRole;
  prefix: 'DEFAULT_ADMIN' | 'DEFAULT_VAQUEIRO';
  fallbackName: string;
}

/**
 * Garante, na subida da aplicacao, um ADMIN e um VAQUEIRO "locais" (login por
 * e-mail e senha, sem Google) quando as variaveis de ambiente os definem.
 *
 * - Sem variaveis, usa as contas de teste de `TEST_ACCOUNTS` (login por e-mail e
 *   senha). Defina `DEFAULT_*` para trocar ou `DEFAULT_ACCOUNTS_DISABLED=true`
 *   para nao criar nada.
 * - Idempotente: se o e-mail ja existe, a conta nao e tocada (senha incluida).
 * - O VAQUEIRO e vinculado ao ADMIN via `adminId`, como no cadastro interno,
 *   para os dois enxergarem o mesmo rebanho.
 * - Falha aqui nunca derruba a API: apenas registra o motivo.
 */
@Injectable()
export class DefaultAccountsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DefaultAccountsService.name);

  constructor(
    @Inject(IUserRepository) private readonly userRepository: IUserRepository,
    @Inject(IHashService) private readonly hashService: IHashService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.ensureDefaultAccounts();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Contas padrao nao foram criadas: ${reason}`);
    }
  }

  async ensureDefaultAccounts(): Promise<void> {
    if (this.isDisabled()) return;

    const admin = await this.ensureAccount({
      role: UserRole.ADMIN,
      prefix: 'DEFAULT_ADMIN',
      fallbackName: 'Administrador',
    });

    const adminEmail = this.read('DEFAULT_ADMIN_EMAIL')?.toLowerCase();
    const adminRecord = admin ?? (adminEmail ? await this.userRepository.findByEmail(adminEmail) : null);

    if (!adminRecord || adminRecord.role !== UserRole.ADMIN) {
      this.logger.warn('Vaqueiro padrao ignorado: nao ha ADMIN padrao configurado/existente.');
      return;
    }

    await this.ensureAccount(
      { role: UserRole.VAQUEIRO, prefix: 'DEFAULT_VAQUEIRO', fallbackName: 'Vaqueiro' },
      adminRecord.id,
    );
  }

  /** Retorna a conta criada, ou `null` se nao configurada/invalida/ja existente. */
  private async ensureAccount(spec: AccountSpec, adminId?: number): Promise<UserEntity | null> {
    const email = this.read(`${spec.prefix}_EMAIL`)?.toLowerCase();
    const password = this.read(`${spec.prefix}_PASSWORD`);
    if (!email || !password) return null;

    if (!PASSWORD_POLICY.test(password)) {
      this.logger.warn(`${spec.prefix}_PASSWORD fora da politica de senha; conta ${spec.role} nao criada.`);
      return null;
    }

    if (await this.userRepository.findByEmail(email)) return null;

    const created = await this.userRepository.create({
      name: this.read(`${spec.prefix}_NAME`) ?? spec.fallbackName,
      email,
      password: await this.hashService.hash(password, BCRYPT_ROUNDS_USER_CREATION),
      role: spec.role,
      userType: UserType.Pecuarista,
      userCategory: UserCategory.Fisica,
      city: this.read('DEFAULT_ACCOUNTS_CITY') ?? 'Belo Jardim',
      state: this.read('DEFAULT_ACCOUNTS_STATE') ?? 'PE',
      adminId: spec.role === UserRole.VAQUEIRO ? adminId : undefined,
    });
    this.logger.log(`Conta padrao ${spec.role} criada: ${created.email} (ID: ${created.id})`);
    return created;
  }

  private isDisabled(): boolean {
    return this.configService.get<string>('DEFAULT_ACCOUNTS_DISABLED')?.trim().toLowerCase() === 'true';
  }

  /** Valor do ambiente; sem ele, o das contas de teste (exceto em NODE_ENV=test). */
  private read(key: string): string | undefined {
    const value = this.configService.get<string>(key)?.trim();
    if (value) return value;

    const match = /^(DEFAULT_ADMIN|DEFAULT_VAQUEIRO)_(EMAIL|PASSWORD|NAME)$/.exec(key);
    if (!match || this.configService.get<string>('NODE_ENV') === 'test') return undefined;
    const account = TEST_ACCOUNTS[match[1] as keyof typeof TEST_ACCOUNTS];
    return account[match[2].toLowerCase() as 'email' | 'password' | 'name'];
  }
}

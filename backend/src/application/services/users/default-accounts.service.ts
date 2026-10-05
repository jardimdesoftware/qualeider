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

interface AccountSpec {
  role: UserRole;
  prefix: 'DEFAULT_ADMIN' | 'DEFAULT_VAQUEIRO';
  fallbackName: string;
}

/**
 * Garante, na subida da aplicacao, um ADMIN e um VAQUEIRO "locais" (login por
 * e-mail e senha, sem Google) quando as variaveis de ambiente os definem.
 *
 * - Nada e criado sem `DEFAULT_*_EMAIL` e `DEFAULT_*_PASSWORD`: nao existe
 *   credencial padrao no codigo (o repositorio e publico).
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
    const admin = await this.ensureAccount({
      role: UserRole.ADMIN,
      prefix: 'DEFAULT_ADMIN',
      fallbackName: 'Administrador',
    });

    const adminEmail = this.read('DEFAULT_ADMIN_EMAIL');
    const adminRecord = admin ?? (adminEmail ? await this.userRepository.findByEmail(adminEmail) : null);

    if (!adminRecord || adminRecord.role !== UserRole.ADMIN) {
      if (this.read('DEFAULT_VAQUEIRO_EMAIL')) {
        this.logger.warn('Vaqueiro padrao ignorado: nao ha ADMIN padrao configurado/existente.');
      }
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

  private read(key: string): string | undefined {
    const value = this.configService.get<string>(key)?.trim();
    return value ? value : undefined;
  }
}

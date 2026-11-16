import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { Status, UserCategory, UserRole, UserType } from '@/domain/enums/enums';
import { UserEntity } from '@/domain/entities/user.entity';

// Mesma politica de senha do cadastro de usuarios (CreateUserDto).
const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/;

/**
 * Conta de TESTE embutida de proposito (decisao do projeto: ambiente de
 * demonstracao/avaliacao). Qualquer `DEFAULT_ADMIN_*` no ambiente sobrescreve estes
 * valores; `DEFAULT_ACCOUNTS_DISABLED=true` desliga a criacao (use em producao
 * real). Em NODE_ENV=test nada e criado por padrao, para nao sujar a base dos
 * testes.
 */
const TEST_ADMIN = { email: 'admin@qualeider.test', password: 'Teste@12345', name: 'Administrador de Teste' };

/**
 * Garante, na subida da aplicacao, o UNICO ADMIN fixo do sistema (login por
 * e-mail e senha, sem Google). Nao existe mais vaqueiro fixo: as demais contas
 * vem do login pelo Google ou sao criadas por um admin (Funcionarios).
 *
 * - Sem variaveis, usa o admin de teste (`TEST_ADMIN`). Defina `DEFAULT_ADMIN_*`
 *   para trocar ou `DEFAULT_ACCOUNTS_DISABLED=true` para nao criar nada.
 * - Idempotente: se o e-mail ja existe, a conta nao e alterada (senha incluida),
 *   exceto que, se estiver inativa, e reativada a cada subida.
 * - Sem corrida: chamadas simultaneas no mesmo processo compartilham uma unica
 *   execucao, e se outra instancia criar a conta no meio do caminho, a conta criada
 *   por ela e adotada como existente.
 * - Falha aqui nunca derruba a API: apenas registra o motivo.
 */
@Injectable()
export class DefaultAccountsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DefaultAccountsService.name);
  private inFlight: Promise<void> | null = null;

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
      this.logger.error(`Conta padrao nao foi criada: ${reason}`);
    }
  }

  /** Chamadas durante uma execucao em andamento reaproveitam a mesma promessa. */
  ensureDefaultAccounts(): Promise<void> {
    if (!this.inFlight) {
      this.inFlight = this.ensureAdmin().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  private async ensureAdmin(): Promise<void> {
    if (this.isDisabled()) return;

    const email = this.read('DEFAULT_ADMIN_EMAIL')?.toLowerCase();
    const password = this.read('DEFAULT_ADMIN_PASSWORD');
    if (!email || !password) return;

    if (!PASSWORD_POLICY.test(password)) {
      this.logger.warn('DEFAULT_ADMIN_PASSWORD fora da politica de senha; conta ADMIN nao criada.');
      return;
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      await this.keepActive(email, existing);
      return;
    }

    const hashedPassword = await this.hashService.hash(password, BCRYPT_ROUNDS_USER_CREATION);
    try {
      const created = await this.userRepository.create({
        name: this.read('DEFAULT_ADMIN_NAME') ?? 'Administrador',
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
        userType: UserType.Pecuarista,
        userCategory: UserCategory.Fisica,
        city: this.read('DEFAULT_ACCOUNTS_CITY') ?? 'Belo Jardim',
        state: this.read('DEFAULT_ACCOUNTS_STATE') ?? 'PE',
      });
      this.logger.log(`Conta padrao ADMIN criada: ${created.email} (ID: ${created.id})`);
    } catch (error) {
      // Corrida entre instancias: outra criou a conta depois do nosso `findByEmail`
      // e o `create` bateu na unicidade do e-mail. Se a conta existe agora, segue
      // como se ja existisse; qualquer outra falha continua sendo propagada.
      const raced = await this.userRepository.findByEmail(email);
      if (!raced) throw error;
      await this.keepActive(email, raced);
    }
  }

  /**
   * Conta ja existe: senha, perfil e dados ficam como estao, mas ela precisa
   * continuar ativa (alguem pode ter desativado a conta padrao).
   */
  private async keepActive(email: string, existing: UserEntity): Promise<void> {
    if (existing.status === Status.Active) return;
    await this.userRepository.update(existing.id, { status: Status.Active });
    this.logger.warn(`Conta padrao ADMIN reativada: ${email} (ID: ${existing.id})`);
  }

  /** E-mail da conta padrao em vigor (vazio se a criacao esta desligada). */
  getDefaultEmails(): string[] {
    if (this.isDisabled()) return [];
    const email = this.read('DEFAULT_ADMIN_EMAIL')?.toLowerCase();
    return email ? [email] : [];
  }

  private isDisabled(): boolean {
    return this.configService.get<string>('DEFAULT_ACCOUNTS_DISABLED')?.trim().toLowerCase() === 'true';
  }

  /** Valor do ambiente; sem ele, o do admin de teste (exceto em NODE_ENV=test). */
  private read(key: string): string | undefined {
    const value = this.configService.get<string>(key)?.trim();
    if (value) return value;

    const match = /^DEFAULT_ADMIN_(EMAIL|PASSWORD|NAME)$/.exec(key);
    if (!match || this.configService.get<string>('NODE_ENV') === 'test') return undefined;
    return TEST_ADMIN[match[1].toLowerCase() as 'email' | 'password' | 'name'];
  }
}

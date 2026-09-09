import {
  HttpStatus,
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { IHashService } from '@/application/ports/hash.service';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { IFailedEmailRepository } from '@/domain/repositories/failed-email.repository';
import { IAllowedEmailRepository } from '@/domain/repositories/allowed-email.repository';
import { MailService } from '@/mail/mail.service';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import {
  BCRYPT_ROUNDS_RESET_PASSWORD,
  BCRYPT_ROUNDS_USER_CREATION,
  RESET_TOKEN_MIN_VALUE,
  RESET_TOKEN_MAX_VALUE,
  RESET_TOKEN_EXPIRY_MINUTES,
} from '@/common/constants/security.constants';
import { isIfpeEmail } from '@/common/utils/email-domain.util';
import { UserEntity } from '@/domain/entities/user.entity';
import { AssociationEntity } from '@/domain/entities/association.entity';
import { Status, UserRole, UserCategory } from '@/domain/enums/enums';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IAssociationRepository) private associationRepository: IAssociationRepository,
    @Inject(IAllowedEmailRepository) private allowedEmailRepository: IAllowedEmailRepository,
    private jwtService: JwtService,
    private mailService: MailService,
    @Inject(IHashService) private hashService: IHashService,
    @Inject(IFailedEmailRepository) private failedEmailRepository: IFailedEmailRepository,
    private configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<UserEntity, 'password'> | null> {
    const user = await this.userRepository.findByEmail(email);

    if (user && (await this.hashService.compare(password, user.password))) {
      // Credenciais corretas, mas conta inativa: nega o login com uma
      // mensagem explicita em vez de emitir um token que so falharia depois
      // (JwtStrategy/findById ja filtram usuarios Inactive, mas isso
      // deixava o /auth/login mentir dizendo "sucesso" pra uma conta
      // desativada).
      if (user.status !== Status.Active) {
        throw new UnauthorizedException(
          'Conta inativa. Entre em contato com o administrador.',
        );
      }

      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async validateAssociation(
    email: string,
    password: string,
  ): Promise<Omit<AssociationEntity, 'password'> | null> {
    const association = await this.associationRepository.findByEmail(email);

    if (
      association &&
      (await this.hashService.compare(password, association.password))
    ) {
      const { password, ...result } = association;
      return result;
    }

    return null;
  }

  async executeLogin(loginDto: { email: string; password: string }) {
    // Try User login first
    let entity:
      | Omit<UserEntity, 'password'>
      | Omit<AssociationEntity, 'password'>
      | null = await this.validateUser(loginDto.email, loginDto.password);
    let entityType: 'user' | 'association' = 'user';

    // If not a user, try Association login
    if (!entity) {
      const association = await this.validateAssociation(
        loginDto.email,
        loginDto.password,
      );
      if (association) {
        entity = association;
        entityType = 'association';
      }
    }

    if (!entity) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.loginEntity(entity, entityType);
  }

  async login(user: any) {
    return this.loginEntity(user, 'user');
  }

  /** Monta a URL de consentimento do Google para a qual GET /auth/google redireciona. */
  getGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
      redirect_uri: this.configService.get<string>('GOOGLE_CALLBACK_URL') ?? '',
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Troca o `code` do callback do Google por um id_token e autentica. O
   * id_token vem direto do endpoint de token do Google (server-to-server,
   * via HTTPS), então decodificar o payload sem re-verificar a assinatura é
   * seguro aqui - não é um valor vindo do cliente.
   */
  async handleGoogleCallback(code: string) {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
        client_secret:
          this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
        redirect_uri:
          this.configService.get<string>('GOOGLE_CALLBACK_URL') ?? '',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      this.logger.warn(
        `Falha ao trocar code do Google por token: ${tokenResponse.status}`,
      );
      throw new UnauthorizedException('Não foi possível autenticar com o Google.');
    }

    const { id_token } = (await tokenResponse.json()) as { id_token: string };
    const payload = this.decodeGoogleIdToken(id_token);

    if (!payload.email_verified) {
      throw new UnauthorizedException('Email do Google não verificado.');
    }

    return this.loginWithGoogle({ email: payload.email, name: payload.name });
  }

  private decodeGoogleIdToken(idToken: string): GoogleIdTokenPayload {
    const payloadSegment = idToken.split('.')[1];
    const json = Buffer.from(payloadSegment, 'base64url').toString('utf8');
    return JSON.parse(json) as GoogleIdTokenPayload;
  }

  /**
   * Login via Google: emails @ifpe.edu.br (qualquer subdomínio) entram
   * direto - se ainda não existe conta, cria uma como Vaqueiro vinculada ao
   * primeiro Admin cadastrado (não existem "fazendas" separadas aqui, é tudo
   * uma instalação única do IFPE). Emails de fora do domínio só entram se um
   * Admin os liberou antes na tela de Funcionários (ver AllowedEmailsController).
   */
  async loginWithGoogle(profile: { email: string; name?: string }) {
    const email = profile.email.toLowerCase().trim();

    const isAllowed =
      isIfpeEmail(email) ||
      (await this.allowedEmailRepository.findByEmail(email)) !== null;

    if (!isAllowed) {
      throw new UnauthorizedException(
        'Este email não tem acesso. Peça para um administrador liberar seu email na tela de Funcionários.',
      );
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      if (existing.status !== Status.Active) {
        throw new UnauthorizedException(
          'Conta inativa. Entre em contato com o administrador.',
        );
      }
      return this.loginEntity(existing, 'user');
    }

    const admin = await this.userRepository.findFirstAdmin();
    if (!admin) {
      throw new UnauthorizedException(
        'Ainda não há um administrador cadastrado no sistema.',
      );
    }

    // Conta Google-only: senha nunca é usada para logar, só existe para
    // satisfazer a coluna obrigatória - por isso é aleatória e descartada.
    const randomPassword = await this.hashService.hash(
      randomBytes(32).toString('hex'),
      BCRYPT_ROUNDS_USER_CREATION,
    );

    const created = await this.userRepository.create({
      name: profile.name?.trim() || email.split('@')[0],
      email,
      password: randomPassword,
      role: UserRole.VAQUEIRO,
      userCategory: UserCategory.Fisica,
      city: 'Não informado',
      state: 'PE',
      adminId: admin.id,
    });

    this.logger.log(`Conta criada via login com Google: ${created.email}`);

    return this.loginEntity(created, 'user');
  }

  async loginEntity(entity: any, entityType: 'user' | 'association') {
    const payload = {
      email: entity.email,
      sub: entity.id,
      associationId: entityType === 'user' ? entity.associationId : null,
      userType: entityType,
      // role só existe para entidades do tipo 'user' (ADMIN | VAQUEIRO)
      role: entityType === 'user' ? (entity.role ?? null) : null,
    };

    this.logger.log(`${entityType === 'user' ? 'Usuário' : 'Associação'} autenticado: ${entity.email}`);

    if (entityType === 'user') {
      await this.userRepository.update(entity.id, { lastLogin: new Date() });
    }

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();

    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new EntityNotFoundException('E-mail não encontrado no sistema.');
    }

    try {
      const resetToken = Math.floor(
        RESET_TOKEN_MIN_VALUE + Math.random() * RESET_TOKEN_MAX_VALUE,
      ).toString();

      const resetTokenExpiry = new Date();
      resetTokenExpiry.setMinutes(
        resetTokenExpiry.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES,
      );

      await this.userRepository.update(user.id, {
        resetToken,
        resetTokenExpiry,
      });

      // O token ja foi persistido nesse ponto. Uma falha apenas no ENVIO do
      // e-mail (SMTP fora do ar, credenciais invalidas/ausentes, etc.) nao
      // deve derrubar a requisicao com 500: registramos a falha na mesma
      // fila (failed_emails) usada pelo fluxo de notificacoes e continuamos
      // respondendo com sucesso ao cliente.
      try {
        await this.mailService.sendResetPasswordEmail(
          user.email,
          resetToken,
          user.name,
          { expiryDate: resetTokenExpiry },
        );
        this.logger.log(`Token de reset enviado para ${user.email}`);
      } catch (mailError) {
        this.logger.error(
          `Falha ao enviar e-mail de redefinição de senha para ${user.email}:`,
          mailError,
        );
        await this.recordFailedResetEmail(user.email, resetToken, resetTokenExpiry, mailError);
      }

      return {
        status: HttpStatus.CREATED,
        message: 'E-mail de redefinição de senha enviado com sucesso.',
      };
    } catch (error) {
      this.logger.error('Erro ao processar reset de senha:', error);
      throw error;
    }
  }

  private async recordFailedResetEmail(
    to: string,
    resetToken: string,
    resetTokenExpiry: Date,
    error: unknown,
  ) {
    try {
      await this.failedEmailRepository.create({
        payload: {
          to,
          subject: 'Redefinição de senha',
          template: 'reset-password',
          context: { resetToken, expiryDate: resetTokenExpiry },
        },
        errorReason: error instanceof Error ? error.message : String(error),
        retryCount: 0,
      });
    } catch (dlqError) {
      this.logger.error(
        'CRÍTICO: Falha ao salvar e-mail de redefinição de senha na DLQ!',
        dlqError,
      );
    }
  }

  async validateResetToken(email: string, token: string): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new EntityNotFoundException('Usuário não encontrado.');
    }

    if (!user.resetToken || user.resetToken !== token) {
      throw new UnauthorizedException('Token inválido.');
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      throw new UnauthorizedException(
        'Token expirado. Solicite um novo código.',
      );
    }

    const newExpiry = new Date();
    newExpiry.setMinutes(newExpiry.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

    await this.userRepository.update(user.id, {
      resetTokenExpiry: newExpiry,
    });

    this.logger.log(`Token validado para ${email}, validade estendida`);

    return user;
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.validateResetToken(email, token);

    const hashedPassword = await this.hashService.hash(
      newPassword,
      BCRYPT_ROUNDS_RESET_PASSWORD,
    );
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    this.logger.log(`Senha redefinida para ${email}`);

    return true;
  }
}

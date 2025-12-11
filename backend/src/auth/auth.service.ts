import {
  HttpStatus,
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IHashService } from '@/application/ports/hash.service';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { MailService } from '@/mail/mail.service';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import {
  BCRYPT_ROUNDS_RESET_PASSWORD,
  RESET_TOKEN_MIN_VALUE,
  RESET_TOKEN_MAX_VALUE,
  RESET_TOKEN_EXPIRY_MINUTES,
} from '@/common/constants/security.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IAssociationRepository) private associationRepository: IAssociationRepository,
    private jwtService: JwtService,
    private mailService: MailService,
    @Inject(IHashService) private hashService: IHashService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findByEmail(email);

    if (user && (await this.hashService.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    throw new UnauthorizedException('Credenciais inválidas.');
  }

  async validateAssociation(email: string, password: string): Promise<any> {
    const association = await this.associationRepository.findByEmail(email);

    if (association && (await this.hashService.compare(password, association.password))) {
      const { password, ...result } = association;
      return result;
    }

    return null;
  }

  async executeLogin(loginDto: { email: string; password: string }) {
    // Try User login first
    let entity = await this.validateUser(loginDto.email, loginDto.password);
    let entityType: 'user' | 'association' = 'user';

    // If not a user, try Association login
    if (!entity) {
      entity = await this.validateAssociation(loginDto.email, loginDto.password);
      entityType = 'association';
    }

    if (!entity) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.loginEntity(entity, entityType);
  }

  async login(user: any) {
    return this.loginEntity(user, 'user');
  }

  async loginEntity(entity: any, entityType: 'user' | 'association') {
    const payload = {
      email: entity.email,
      sub: entity.id,
      associationId: entityType === 'user' ? entity.associationId : null,
      userType: entityType,
    };

    this.logger.log(`${entityType === 'user' ? 'Usuário' : 'Associação'} autenticado: ${entity.email}`);

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(email: string, request?: any) {
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

      await this.mailService.sendResetPasswordEmail(
        user.email,
        resetToken,
        user.name,
        { expiryDate: resetTokenExpiry },
      );

      this.logger.log(`Token de reset enviado para ${user.email}`);

      return {
        status: HttpStatus.CREATED,
        message: 'E-mail de redefinição de senha enviado com sucesso.',
      };
    } catch (error) {
      this.logger.error('Erro ao processar reset de senha:', error);
      throw error;
    }
  }

  async validateResetToken(email: string, token: string): Promise<boolean> {
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

    return true;
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    await this.validateResetToken(email, token);

    const user = await this.userRepository.findByEmail(email);

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

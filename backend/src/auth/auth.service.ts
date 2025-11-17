import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/application/services/users/users.service';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';
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
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    throw new UnauthorizedException('Credenciais inválidas.');
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      associationId: user.associationId,
    };

    this.logger.log(`Usuário autenticado: ${user.email}`);

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(email: string, request?: any) {
    const normalizedEmail = email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('E-mail não encontrado no sistema.');
    }

    try {
      const resetToken = Math.floor(
        RESET_TOKEN_MIN_VALUE + Math.random() * RESET_TOKEN_MAX_VALUE,
      ).toString();

      const resetTokenExpiry = new Date();
      resetTokenExpiry.setMinutes(
        resetTokenExpiry.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES,
      );

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      let metadata = {
        expiryDate: resetTokenExpiry,
        device: 'Não disponível',
        browser: 'Não disponível',
        ipAddress: 'Não disponível',
      };

      if (request) {
        const userAgent = request.headers['user-agent'] || '';
        const ip =
          request.ip || request.connection.remoteAddress || 'Não disponível';

        const getOS = (ua: string) => {
          if (ua.includes('Windows NT 10.0')) return 'Windows 10';
          if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
          if (ua.includes('Windows NT 6.2')) return 'Windows 8';
          if (ua.includes('Windows NT 6.1')) return 'Windows 7';
          if (ua.includes('Mac OS X')) return 'macOS';
          if (ua.includes('Linux')) return 'Linux';
          if (ua.includes('Android')) return 'Android';
          if (ua.includes('iOS')) return 'iOS';
          return 'Desconhecido';
        };

        const getBrowser = (ua: string) => {
          if (ua.includes('Edg/')) return 'Edge';
          if (ua.includes('Chrome/')) return 'Chrome';
          if (ua.includes('Firefox/')) return 'Firefox';
          if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
          if (ua.includes('Opera/') || ua.includes('OPR/')) return 'Opera';
          return 'Desconhecido';
        };

        metadata = {
          expiryDate: resetTokenExpiry,
          device: getOS(userAgent),
          browser: getBrowser(userAgent),
          ipAddress: ip,
        };
      }

      await this.mailService.sendResetPasswordEmail(
        user.email,
        resetToken,
        user.name,
        metadata,
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
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenExpiry: newExpiry,
      },
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

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      BCRYPT_ROUNDS_RESET_PASSWORD,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    this.logger.log(`Senha redefinida para ${email}`);

    return true;
  }
}

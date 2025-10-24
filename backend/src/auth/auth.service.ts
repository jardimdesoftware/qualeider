import {
  Body,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/application/services/users/users.service';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class AuthService {
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
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(email: string, request?: any) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('E-mail não encontrado no sistema.');
    }

    try {
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

      const resetTokenExpiry = new Date();
      resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Extrai metadados do request se disponível
      let metadata = {
        expiryDate: resetTokenExpiry,
        location: 'Não disponível',
        device: 'Não disponível',
        browser: 'Não disponível',
        ipAddress: 'Não disponível',
      };

      if (request) {
        const userAgent = request.headers['user-agent'] || '';
        const ip =
          request.ip || request.connection.remoteAddress || 'Não disponível';

        // Extrai informações do User-Agent
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
          location: 'Não disponível', // Pode usar serviço de geolocalização por IP
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

      return {
        status: HttpStatus.CREATED,
        message: 'E-mail de redefinição de senha enviado com sucesso.',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao enviar o e-mail de recuperação.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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

    // Estende a validade do token por mais 15 minutos após validação bem-sucedida
    const newExpiry = new Date();
    newExpiry.setMinutes(newExpiry.getMinutes() + 15);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenExpiry: newExpiry,
      },
    });

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

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return true;
  }
}

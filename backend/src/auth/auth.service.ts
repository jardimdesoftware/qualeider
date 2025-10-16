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

  async forgotPassword(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('Usuário não encontrado.');
      }

      const resetToken = Math.random().toString(36).substring(2, 15);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetToken },
      });

      await this.mailService.sendResetPasswordEmail(user.email, resetToken);

      // Retorna uma resposta de sucesso
      return {
        status: HttpStatus.CREATED, // Status 201
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

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return false;
    }

    if (user.resetToken !== token) {
      throw new Error('Token inválido.');
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      throw new Error('Token expirado.');
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

import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  Req,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/application/dtos/auth/login.dto';
import { ForgotPasswordDto } from '@/application/dtos/auth/forgot-password.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResetPasswordDto } from '@/application/dtos/auth/reset-password.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso. Retorna um token JWT.',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    return this.authService.login(user);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({
    status: 201,
    description: 'E-mail de redefinição de senha enviado com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto.email, request);
  }

  @Post('validate-reset-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Validar token de redefinição de senha' })
  @ApiResponse({
    status: 200,
    description: 'Token válido.',
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async validateResetToken(@Body() body: { email: string; token: string }) {
    const isValid = await this.authService.validateResetToken(
      body.email,
      body.token,
    );
    return { valid: isValid, message: 'Token válido.' };
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Redefinir senha' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { email, token, newPassword } = resetPasswordDto;
    await this.authService.resetPassword(email, token, newPassword);
    return { message: 'Senha redefinida com sucesso.' };
  }
}

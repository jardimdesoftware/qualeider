import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { LoginDto } from '../../auth/dto/login.dto';
import { ForgotPasswordDto } from '../../auth/dto/forgot-password.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResetPasswordDto } from '../../auth/dto/reset-password.dto';

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
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefinir senha' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { email, token, newPassword } = resetPasswordDto;
    const result = await this.authService.resetPassword(
      email,
      token,
      newPassword,
    );
    if (!result) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
    return { message: 'Senha redefinida com sucesso.' };
  }
}

import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/application/dtos/auth/login.dto';
import { ForgotPasswordDto } from '@/application/dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '@/application/dtos/auth/reset-password.dto';
import { ValidateTokenDto } from '@/application/dtos/auth/validate-token.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
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

    const result = await this.authService.login(user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Login realizado com sucesso',
      data: result,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({
    status: 200,
    description: 'E-mail de redefinição de senha enviado com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    await this.authService.forgotPassword(forgotPasswordDto.email, request);

    return {
      statusCode: HttpStatus.OK,
      message: 'Se o e-mail existir, você receberá um link de redefinição.',
    };
  }

  @Post('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar token de redefinição de senha' })
  @ApiResponse({ status: 200, description: 'Token válido.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  async validateResetToken(@Body() dto: ValidateTokenDto) {
    const isValid = await this.authService.validateResetToken(
      dto.email,
      dto.token,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Token válido',
      data: { valid: isValid },
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso.' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { email, token, newPassword } = resetPasswordDto;

    await this.authService.resetPassword(email, token, newPassword);

    return {
      statusCode: HttpStatus.OK,
      message: 'Senha redefinida com sucesso.',
    };
  }
}

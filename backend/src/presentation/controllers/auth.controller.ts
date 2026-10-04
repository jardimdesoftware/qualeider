import {
  Controller,
  Post,
  Get,
  Query,
  Req,
  Res,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE_PATH,
  GOOGLE_OAUTH_STATE_TTL_MS,
  generateOAuthState,
  isValidOAuthState,
  readCookie,
} from '@/common/utils/oauth-state.util';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_TTL } from '@/common/throttler/throttler.config';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/application/dtos/auth/login.dto';
import { ForgotPasswordDto } from '@/application/dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '@/application/dtos/auth/reset-password.dto';
import { ValidateTokenDto } from '@/application/dtos/auth/validate-token.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Public } from '@/common/decorators/public.decorator';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// SameSite=Lax: o cookie acompanha a navegação de volta do Google (GET de
// topo) mas não requisições disparadas por outros sites.
function googleStateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: FRONTEND_URL.startsWith('https://'),
    path: GOOGLE_OAUTH_STATE_COOKIE_PATH,
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // [BR-004] Rate Limiting Login
  @Throttle({ default: { limit: 3, ttl: THROTTLE_TTL.SHORT } })
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso. Retorna um token JWT.',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @ResponseMessage('Login realizado com sucesso')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.executeLogin(loginDto);
  }

  @Get('google')
  @Public()
  @ApiOperation({ summary: 'Redireciona para a tela de consentimento do Google' })
  googleRedirect(@Res() res: Response) {
    const state = generateOAuthState();
    res.cookie(GOOGLE_OAUTH_STATE_COOKIE, state, {
      ...googleStateCookieOptions(),
      maxAge: GOOGLE_OAUTH_STATE_TTL_MS,
    });
    res.redirect(this.authService.getGoogleAuthUrl(state));
  }

  @Throttle({ default: { limit: 5, ttl: THROTTLE_TTL.SHORT } })
  @Get('google/callback')
  @Public()
  @ApiOperation({ summary: 'Callback do OAuth do Google' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const expectedState = readCookie(req.headers.cookie, GOOGLE_OAUTH_STATE_COOKIE);
    // Uso único: o cookie é descartado independentemente do resultado.
    res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, googleStateCookieOptions());

    if (!code || !isValidOAuthState(state, expectedState)) {
      res.redirect(
        `${FRONTEND_URL}/login?error=${encodeURIComponent(
          'Sessão de login com o Google inválida ou expirada. Tente novamente.',
        )}`,
      );
      return;
    }

    try {
      const { access_token } = await this.authService.handleGoogleCallback(code);
      res.redirect(`${FRONTEND_URL}/google-callback?token=${access_token}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível autenticar com o Google.';
      res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
    }
  }

  @Throttle({ default: { limit: 3, ttl: THROTTLE_TTL.LONG } }) // 3 tentativas por 5min (300s prod, 2s test)
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'E-mail de redefinição de senha enviado com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ResponseMessage('Se o e-mail existir, você receberá um link de redefinição.')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle({ default: { limit: 5, ttl: THROTTLE_TTL.SHORT } }) // 5 tentativas por minuto (60s prod, 2s test) 
  @Post('validate-reset-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar token de redefinição de senha' })
  @ApiBody({ type: ValidateTokenDto })
  @ApiResponse({ status: 200, description: 'Token válido.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  @ResponseMessage('Token válido')
  async validateResetToken(@Body() dto: ValidateTokenDto) {
    await this.authService.validateResetToken(dto.email, dto.token);
    return { valid: true };
  }

  @Throttle({ default: { limit: 3, ttl: THROTTLE_TTL.LONG } }) // 3 tentativas por 5min (300s prod, 2s test)
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso.' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado.' })
  @ResponseMessage('Senha redefinida com sucesso.')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { email, token, newPassword } = resetPasswordDto;
    await this.authService.resetPassword(email, token, newPassword);
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '@/presentation/controllers/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/application/dtos/auth/login.dto';
import { ForgotPasswordDto } from '@/application/dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '@/application/dtos/auth/reset-password.dto';
import { ValidateTokenDto } from '@/application/dtos/auth/validate-token.dto';
import { createUser } from '../../../factories/user.factory';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  hashOAuthState,
} from '@/common/utils/oauth-state.util';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    executeLogin: jest.fn(),
    forgotPassword: jest.fn(),
    validateResetToken: jest.fn(),
    resetPassword: jest.fn(),
    getGoogleAuthUrl: jest.fn(),
    handleGoogleCallback: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve retornar wrapper de sucesso com token JWT', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      const user = createUser({ email: loginDto.email });
      const loginResponse = { access_token: 'jwt-token', user };

      mockAuthService.executeLogin.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(authService.executeLogin).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(loginResponse);
    });

    it('deve lançar UnauthorizedException quando as credenciais são inválidas', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      mockAuthService.executeLogin.mockRejectedValue(
        new UnauthorizedException('Credenciais inválidas.'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas.',
      );
    });
  });

  describe('forgotPassword', () => {
    it('deve retornar mensagem de sucesso padronizada', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'user@example.com',
      };

      mockAuthService.forgotPassword.mockResolvedValue(undefined);

      const result = await controller.forgotPassword(
        forgotPasswordDto,
      );

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
      expect(result).toBeUndefined();
    });

    it('deve propagar erro do service (ex: EntityNotFoundException)', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      };
      const error = new EntityNotFoundException('Usuário não encontrado.');
      
      mockAuthService.forgotPassword.mockRejectedValue(error);

      await expect(
        controller.forgotPassword(forgotPasswordDto),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('validateResetToken', () => {
    it('deve retornar status válido no formato padronizado', async () => {
      const dto: ValidateTokenDto = {
        email: 'user@example.com',
        token: 'valid-token-123',
      };

      mockAuthService.validateResetToken.mockResolvedValue(true);

      const result = await controller.validateResetToken(dto);

      expect(authService.validateResetToken).toHaveBeenCalledWith(
        dto.email,
        dto.token,
      );
      expect(result).toEqual({ valid: true });
    });

    it('deve propagar erro do service (ex: token inválido)', async () => {
      const dto: ValidateTokenDto = {
        email: 'user@example.com',
        token: 'invalid-token',
      };

      const error = new UnauthorizedException('Token inválido.');
      mockAuthService.validateResetToken.mockRejectedValue(error);

      await expect(controller.validateResetToken(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha e retornar sucesso padronizado', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        email: 'user@example.com',
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      };

      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.email,
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
      expect(result).toBeUndefined();
    });

    it('deve propagar UnauthorizedException quando token é inválido', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        email: 'user@example.com',
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
      };

      const unauthorizedError = new UnauthorizedException(
        'Token inválido ou expirado.',
      );
      mockAuthService.resetPassword.mockRejectedValue(unauthorizedError);

      await expect(
        controller.resetPassword(resetPasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve propagar EntityNotFoundException quando email não existe', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        email: 'nonexistent@example.com',
        token: 'token-123',
        newPassword: 'Password123!',
      };

      const notFoundError = new EntityNotFoundException('Usuário não encontrado.');
      mockAuthService.resetPassword.mockRejectedValue(notFoundError);

      await expect(
        controller.resetPassword(resetPasswordDto),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });
  describe('Google OAuth', () => {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const buildRes = () =>
      ({ cookie: jest.fn(), clearCookie: jest.fn(), redirect: jest.fn() }) as any;
    const reqWithStateCookie = (state?: string) =>
      ({
        headers: {
          cookie: state ? `${GOOGLE_OAUTH_STATE_COOKIE}=${hashOAuthState(state)}` : undefined,
        },
      }) as any;
    const errorRedirect = (message: string) =>
      `${FRONTEND_URL}/login?error=${encodeURIComponent(message)}`;
    const INVALID_STATE_MESSAGE =
      'Sessão de login com o Google inválida ou expirada. Tente novamente.';

    describe('googleRedirect', () => {
      it('grava só o hash do state em cookie HttpOnly/Lax e manda o state cru ao Google', () => {
        const res = buildRes();
        mockAuthService.getGoogleAuthUrl.mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?x=1');

        controller.googleRedirect(res);

        const state = mockAuthService.getGoogleAuthUrl.mock.calls[0][0];
        expect(state).toMatch(/^[0-9a-f]{64}$/);
        expect(res.cookie).toHaveBeenCalledWith(
          GOOGLE_OAUTH_STATE_COOKIE,
          hashOAuthState(state),
          expect.objectContaining({
            httpOnly: true,
            sameSite: 'lax',
            path: '/api/auth/google',
            maxAge: 10 * 60 * 1000,
            secure: FRONTEND_URL.startsWith('https://'),
          }),
        );
        expect(res.cookie.mock.calls[0][1]).not.toBe(state);
        expect(res.redirect).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth?x=1');
      });
    });

    describe('googleCallback', () => {
      it('state válido: autentica e redireciona ao frontend com o token', async () => {
        const res = buildRes();
        mockAuthService.handleGoogleCallback.mockResolvedValue({ access_token: 'jwt-123' });

        await controller.googleCallback('codigo', 'estado-ok', reqWithStateCookie('estado-ok'), res);

        expect(mockAuthService.handleGoogleCallback).toHaveBeenCalledWith('codigo');
        expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND_URL}/google-callback?token=jwt-123`);
      });

      it('descarta o cookie de state em qualquer resultado (uso único)', async () => {
        const res = buildRes();

        await controller.googleCallback('codigo', 'forjado', reqWithStateCookie(), res);

        expect(res.clearCookie).toHaveBeenCalledWith(
          GOOGLE_OAUTH_STATE_COOKIE,
          expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/api/auth/google' }),
        );
      });

      it.each([
        ['sem cookie de state', 'estado', undefined],
        ['state diferente do cookie', 'outro', 'estado'],
      ])('%s: volta ao login sem falar com o Google', async (_label, urlState, cookieState) => {
        const res = buildRes();

        await controller.googleCallback('codigo', urlState, reqWithStateCookie(cookieState), res);

        expect(mockAuthService.handleGoogleCallback).not.toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith(errorRedirect(INVALID_STATE_MESSAGE));
      });

      it('sem code (usuário negou o acesso): volta ao login sem falar com o Google', async () => {
        const res = buildRes();

        await controller.googleCallback(undefined as any, 'estado', reqWithStateCookie('estado'), res);

        expect(mockAuthService.handleGoogleCallback).not.toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith(errorRedirect(INVALID_STATE_MESSAGE));
      });

      it('falha do serviço: redireciona ao login com a mensagem do erro', async () => {
        const res = buildRes();
        mockAuthService.handleGoogleCallback.mockRejectedValue(
          new UnauthorizedException('Este email não tem acesso.'),
        );

        await controller.googleCallback('codigo', 'estado', reqWithStateCookie('estado'), res);

        expect(res.redirect).toHaveBeenCalledWith(errorRedirect('Este email não tem acesso.'));
      });

      it('falha que não é um Error: usa a mensagem padrão', async () => {
        const res = buildRes();
        mockAuthService.handleGoogleCallback.mockRejectedValue('quebrou');

        await controller.googleCallback('codigo', 'estado', reqWithStateCookie('estado'), res);

        expect(res.redirect).toHaveBeenCalledWith(errorRedirect('Não foi possível autenticar com o Google.'));
      });
    });
  });
});

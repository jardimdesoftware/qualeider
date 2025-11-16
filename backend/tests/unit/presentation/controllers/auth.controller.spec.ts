import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '@/presentation/controllers/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/application/dtos/auth/login.dto';
import { ForgotPasswordDto } from '@/application/dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '@/application/dtos/auth/reset-password.dto';
import { createUser } from '../../../factories/user.factory';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    validateResetToken: jest.fn(),
    resetPassword: jest.fn(),
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
    it('deve retornar um token JWT quando as credenciais são válidas', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      const user = createUser({ email: loginDto.email });
      const loginResponse = { access_token: 'jwt-token', user };

      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(loginResponse);
    });

    it('deve lançar UnauthorizedException quando as credenciais são inválidas', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas.',
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('deve chamar validateUser com email e password corretos', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Test123!',
      };

      const user = createUser({ email: loginDto.email });
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue({
        access_token: 'token',
        user,
      });

      await controller.login(loginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'Test123!',
      );
    });
  });

  describe('forgotPassword', () => {
    it('deve chamar authService.forgotPassword com email e request corretos', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'user@example.com',
      };

      const mockRequest = {
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
      } as unknown as Request;

      const expectedResult = {
        message: 'E-mail de redefinição de senha enviado.',
      };

      mockAuthService.forgotPassword.mockResolvedValue(expectedResult);

      const result = await controller.forgotPassword(
        forgotPasswordDto,
        mockRequest,
      );

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
        mockRequest,
      );
      expect(result).toEqual(expectedResult);
    });

    it('deve retornar mensagem de sucesso', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'user@example.com',
      };

      const mockRequest = {
        protocol: 'https',
        get: jest.fn().mockReturnValue('app.example.com'),
      } as unknown as Request;

      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'E-mail de redefinição de senha enviado.',
      });

      const result = await controller.forgotPassword(
        forgotPasswordDto,
        mockRequest,
      );

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('E-mail de redefinição de senha enviado.');
    });

    it('deve propagar NotFoundException quando email não existe', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      const mockRequest = {} as Request;

      const notFoundError = new Error('Usuário não encontrado.');
      mockAuthService.forgotPassword.mockRejectedValue(notFoundError);

      await expect(
        controller.forgotPassword(forgotPasswordDto, mockRequest),
      ).rejects.toThrow('Usuário não encontrado.');
    });
  });

  describe('validateResetToken', () => {
    it('deve retornar válido quando o token é correto', async () => {
      const body = {
        email: 'user@example.com',
        token: 'valid-token-123',
      };

      mockAuthService.validateResetToken.mockResolvedValue(true);

      const result = await controller.validateResetToken(body);

      expect(authService.validateResetToken).toHaveBeenCalledWith(
        body.email,
        body.token,
      );
      expect(result).toEqual({
        valid: true,
        message: 'Token válido.',
      });
    });

    it('deve retornar inválido quando o token está incorreto', async () => {
      const body = {
        email: 'user@example.com',
        token: 'invalid-token',
      };

      mockAuthService.validateResetToken.mockResolvedValue(false);

      const result = await controller.validateResetToken(body);

      expect(result).toEqual({
        valid: false,
        message: 'Token válido.',
      });
    });

    it('deve propagar erro quando o usuário não existe', async () => {
      const body = {
        email: 'nonexistent@example.com',
        token: 'some-token',
      };

      const notFoundError = new Error('Usuário não encontrado.');
      mockAuthService.validateResetToken.mockRejectedValue(notFoundError);

      await expect(controller.validateResetToken(body)).rejects.toThrow(
        'Usuário não encontrado.',
      );
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha com sucesso', async () => {
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
      expect(result).toEqual({
        message: 'Senha redefinida com sucesso.',
      });
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
      await expect(
        controller.resetPassword(resetPasswordDto),
      ).rejects.toThrow('Token inválido ou expirado.');
    });

    it('deve chamar resetPassword com todos os parâmetros corretos', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        email: 'test@example.com',
        token: 'token-abc-123',
        newPassword: 'SuperSecret123!',
      };

      mockAuthService.resetPassword.mockResolvedValue(undefined);

      await controller.resetPassword(resetPasswordDto);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        'test@example.com',
        'token-abc-123',
        'SuperSecret123!',
      );
    });

    it('deve propagar NotFoundException quando email não existe', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        email: 'nonexistent@example.com',
        token: 'token-123',
        newPassword: 'Password123!',
      };

      const notFoundError = new Error('Usuário não encontrado.');
      mockAuthService.resetPassword.mockRejectedValue(notFoundError);

      await expect(
        controller.resetPassword(resetPasswordDto),
      ).rejects.toThrow('Usuário não encontrado.');
    });
  });
});

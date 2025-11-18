import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, HttpStatus } from '@nestjs/common';
import { AuthController } from '@/presentation/controllers/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/application/dtos/auth/login.dto';
import { ForgotPasswordDto } from '@/application/dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '@/application/dtos/auth/reset-password.dto';
import { ValidateTokenDto } from '@/application/dtos/auth/validate-token.dto';
import { createUser } from '../../../factories/user.factory';
import { Request } from 'express';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

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
    it('deve retornar wrapper de sucesso com token JWT', async () => {
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
      
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Login realizado com sucesso',
        data: loginResponse,
      });
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

      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('deve retornar mensagem de sucesso padronizada', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'user@example.com',
      };

      const mockRequest = {
        protocol: 'https',
        get: jest.fn().mockReturnValue('app.example.com'),
      } as unknown as Request;

      mockAuthService.forgotPassword.mockResolvedValue(undefined);

      const result = await controller.forgotPassword(
        forgotPasswordDto,
        mockRequest,
      );

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
        mockRequest,
      );
      
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Se o e-mail existir, você receberá um link de redefinição.',
      });
    });

    it('deve propagar erro do service (ex: EntityNotFoundException)', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      };
      const mockRequest = {} as Request;
      const error = new EntityNotFoundException('Usuário não encontrado.');
      
      mockAuthService.forgotPassword.mockRejectedValue(error);

      await expect(
        controller.forgotPassword(forgotPasswordDto, mockRequest),
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
      
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Token válido',
        data: { valid: true },
      });
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
      
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
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
});
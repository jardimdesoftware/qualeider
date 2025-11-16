import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from '@/application/dtos/auth/login.dto';
import { ForgotPasswordDto } from '@/application/dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '@/application/dtos/auth/reset-password.dto';

describe('Auth DTOs', () => {
  describe('LoginDto', () => {
    describe('email validation', () => {
      it('deve rejeitar email vazio', async () => {
        const dto = plainToInstance(LoginDto, {
          email: '',
          password: 'password',
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'email')).toBe(true);
      });

      it('deve rejeitar email inválido', async () => {
        const dto = plainToInstance(LoginDto, {
          email: 'invalid-email',
          password: 'password',
        });

        const errors = await validate(dto);
        const emailError = errors.find((e) => e.property === 'email');
        expect(emailError).toBeDefined();
        expect(emailError?.constraints).toHaveProperty('isEmail');
      });

      it('deve aceitar email válido', async () => {
        const dto = plainToInstance(LoginDto, {
          email: 'user@example.com',
          password: 'password',
        });

        const errors = await validate(dto);
        const emailErrors = errors.filter((e) => e.property === 'email');
        expect(emailErrors.length).toBe(0);
      });
    });

    describe('password validation', () => {
      it('deve rejeitar password vazio', async () => {
        const dto = plainToInstance(LoginDto, {
          email: 'user@example.com',
          password: '',
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'password')).toBe(true);
      });

      it('deve aceitar password válido', async () => {
        const dto = plainToInstance(LoginDto, {
          email: 'user@example.com',
          password: 'my-password',
        });

        const errors = await validate(dto);
        const passwordErrors = errors.filter((e) => e.property === 'password');
        expect(passwordErrors.length).toBe(0);
      });
    });

    describe('DTO completo válido', () => {
      it('deve validar DTO completo sem erros', async () => {
        const dto = plainToInstance(LoginDto, {
          email: 'silva.santos@example.com',
          password: 'Senha@123',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
  });

  describe('ForgotPasswordDto', () => {
    describe('email validation', () => {
      it('deve rejeitar email vazio', async () => {
        const dto = plainToInstance(ForgotPasswordDto, {
          email: '',
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'email')).toBe(true);
      });

      it('deve rejeitar email inválido', async () => {
        const dto = plainToInstance(ForgotPasswordDto, {
          email: 'not-an-email',
        });

        const errors = await validate(dto);
        const emailError = errors.find((e) => e.property === 'email');
        expect(emailError).toBeDefined();
        expect(emailError?.constraints).toHaveProperty('isEmail');
      });

      it('deve aceitar email válido', async () => {
        const dto = plainToInstance(ForgotPasswordDto, {
          email: 'user@example.com',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
  });

  describe('ResetPasswordDto', () => {
    describe('email validation', () => {
      it('deve rejeitar email vazio', async () => {
        const dto = plainToInstance(ResetPasswordDto, {
          email: '',
          token: 'valid-token',
          newPassword: 'newPassword123',
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'email')).toBe(true);
      });

      it('deve rejeitar email inválido', async () => {
        const dto = plainToInstance(ResetPasswordDto, {
          email: 'invalid',
          token: 'valid-token',
          newPassword: 'newPassword123',
        });

        const errors = await validate(dto);
        const emailError = errors.find((e) => e.property === 'email');
        expect(emailError).toBeDefined();
        expect(emailError?.constraints).toHaveProperty('isEmail');
      });

      it('deve aceitar email válido', async () => {
        const dto = plainToInstance(ResetPasswordDto, {
          email: 'user@example.com',
          token: 'valid-token',
          newPassword: 'newPassword123',
        });

        const errors = await validate(dto);
        const emailErrors = errors.filter((e) => e.property === 'email');
        expect(emailErrors.length).toBe(0);
      });
    });

    describe('token validation', () => {
      it('deve rejeitar token vazio', async () => {
        const dto = plainToInstance(ResetPasswordDto, {
          email: 'user@example.com',
          token: '',
          newPassword: 'newPassword123',
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'token')).toBe(true);
      });

      it('deve aceitar token válido', async () => {
        const dto = plainToInstance(ResetPasswordDto, {
          email: 'user@example.com',
          token: 'abc123-token',
          newPassword: 'newPassword123',
        });

        const errors = await validate(dto);
        const tokenErrors = errors.filter((e) => e.property === 'token');
        expect(tokenErrors.length).toBe(0);
      });
    });

    describe('newPassword validation', () => {
      it('deve rejeitar newPassword vazio', async () => {
        const dto = plainToInstance(ResetPasswordDto, {
          email: 'user@example.com',
          token: 'valid-token',
          newPassword: '',
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
      });

      it('deve rejeitar newPassword com menos de 6 caracteres', async () => {
        const dto = plainToInstance(ResetPasswordDto, {
          email: 'user@example.com',
          token: 'valid-token',
          newPassword: '12345',
        });

        const errors = await validate(dto);
        const passwordError = errors.find((e) => e.property === 'newPassword');
        expect(passwordError).toBeDefined();
        expect(passwordError?.constraints).toHaveProperty('minLength');
      });

      it('deve aceitar newPassword válido', async () => {
        const dto = plainToInstance(ResetPasswordDto, {
          email: 'user@example.com',
          token: 'valid-token',
          newPassword: 'newPassword123',
        });

        const errors = await validate(dto);
        const passwordErrors = errors.filter(
          (e) => e.property === 'newPassword',
        );
        expect(passwordErrors.length).toBe(0);
      });
    });

    describe('DTO completo válido', () => {
      it('deve validar DTO completo sem erros', async () => {
        const dto = plainToInstance(ResetPasswordDto, {
          email: 'silva.santos@example.com',
          token: 'abc123-reset-token',
          newPassword: 'NovaSenha@2024',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
  });
});

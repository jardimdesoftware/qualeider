import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { RespondInviteDto } from '@/application/dtos/invites/respond-invite.dto';

describe('Invite DTOs', () => {
  describe('CreateInviteDto', () => {
    describe('userId validation', () => {
      it('deve rejeitar userId vazio', async () => {
        const dto = plainToInstance(CreateInviteDto, {
          message: 'Bem-vindo à nossa associação!',
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'userId')).toBe(true);
      });

      it('deve rejeitar userId que não é inteiro', async () => {
        const dto = plainToInstance(CreateInviteDto, {
          userId: 1.5,
          message: 'Bem-vindo à nossa associação!',
        });

        const errors = await validate(dto);
        const userIdError = errors.find((e) => e.property === 'userId');
        expect(userIdError).toBeDefined();
        expect(userIdError?.constraints).toHaveProperty('isInt');
      });

      it('deve aceitar userId válido', async () => {
        const dto = plainToInstance(CreateInviteDto, {
          userId: 5,
          message: 'Bem-vindo à nossa associação!',
        });

        const errors = await validate(dto);
        const userIdErrors = errors.filter((e) => e.property === 'userId');
        expect(userIdErrors.length).toBe(0);
      });
    });

    describe('message validation', () => {
      it('deve aceitar message omitida (opcional)', async () => {
        const dto = plainToInstance(CreateInviteDto, {
          userId: 5,
        });

        const errors = await validate(dto);
        const messageErrors = errors.filter((e) => e.property === 'message');
        expect(messageErrors.length).toBe(0);
      });

      it('deve rejeitar message com menos de 10 caracteres', async () => {
        const dto = plainToInstance(CreateInviteDto, {
          userId: 5,
          message: 'Olá',
        });

        const errors = await validate(dto);
        const messageError = errors.find((e) => e.property === 'message');
        expect(messageError).toBeDefined();
        expect(messageError?.constraints).toHaveProperty('minLength');
      });

      it('deve rejeitar message com mais de 500 caracteres', async () => {
        const dto = plainToInstance(CreateInviteDto, {
          userId: 5,
          message: 'a'.repeat(501),
        });

        const errors = await validate(dto);
        const messageError = errors.find((e) => e.property === 'message');
        expect(messageError).toBeDefined();
        expect(messageError?.constraints).toHaveProperty('maxLength');
      });

      it('deve aceitar message válida', async () => {
        const dto = plainToInstance(CreateInviteDto, {
          userId: 5,
          message: 'Estamos felizes em convidá-lo para nossa associação!',
        });

        const errors = await validate(dto);
        const messageErrors = errors.filter((e) => e.property === 'message');
        expect(messageErrors.length).toBe(0);
      });

      it('deve rejeitar message que não é string', async () => {
        const dto = plainToInstance(CreateInviteDto, {
          userId: 5,
          message: 12345 as any,
        });

        const errors = await validate(dto);
        const messageError = errors.find((e) => e.property === 'message');
        expect(messageError).toBeDefined();
        expect(messageError?.constraints).toHaveProperty('isString');
      });
    });

    describe('DTO completo válido', () => {
      it('deve validar DTO completo sem message', async () => {
        const dto = plainToInstance(CreateInviteDto, {
          userId: 10,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('deve validar DTO completo com message', async () => {
        const dto = plainToInstance(CreateInviteDto, {
          userId: 10,
          message:
            'Gostaríamos de convidá-lo a fazer parte da nossa associação de produtores.',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
  });

  describe('RespondInviteDto', () => {
    describe('response validation', () => {
      it('deve rejeitar response vazio', async () => {
        const dto = plainToInstance(RespondInviteDto, {});

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'response')).toBe(true);
      });

      it('deve rejeitar response inválido', async () => {
        const dto = plainToInstance(RespondInviteDto, {
          response: 'maybe' as any,
        });

        const errors = await validate(dto);
        const responseError = errors.find((e) => e.property === 'response');
        expect(responseError).toBeDefined();
        expect(responseError?.constraints).toHaveProperty('isEnum');
      });

      it('deve aceitar response "accept"', async () => {
        const dto = plainToInstance(RespondInviteDto, {
          response: 'accept',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('deve aceitar response "decline"', async () => {
        const dto = plainToInstance(RespondInviteDto, {
          response: 'decline',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('deve rejeitar valores além de accept/decline', async () => {
        const invalidValues = ['rejected', 'pending', 'yes', 'no', 'cancel'];

        for (const value of invalidValues) {
          const dto = plainToInstance(RespondInviteDto, {
            response: value as any,
          });

          const errors = await validate(dto);
          const responseError = errors.find((e) => e.property === 'response');
          expect(responseError).toBeDefined();
          expect(responseError?.constraints).toHaveProperty('isEnum');
        }
      });
    });
  });
});

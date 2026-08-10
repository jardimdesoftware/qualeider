import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { UserCategory, UserRole } from '@/domain/enums/enums';

/**
 * Regressao da issue #166: editar um funcionario falhava com "Este e-mail
 * já está cadastrado no sistema." mesmo quando o e-mail nao mudava, porque
 * o validador @IsEmailUnique (herdado de CreateUserDto) nao tem como saber
 * qual usuario esta sendo editado e sempre tratava o proprio registro como
 * conflito. Os DTOs de update agora reescrevem `email` sem esse validador,
 * entao esses testes nao precisam mockar IsEmailUniqueConstraint - se ele
 * ainda estivesse presente, `validate()` falharia (constraint assincrona
 * sem provider de banco disponivel neste teste).
 */
describe('UpdateUserDto', () => {
  it('deve validar sem erros ao alterar apenas o nome (email mantido)', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      name: 'Novo Nome',
      email: 'vaqueiro@example.com',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('deve validar sem erros ao alterar apenas o cargo/perfil (role)', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      role: UserRole.ADMIN,
      email: 'vaqueiro@example.com',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('deve validar sem erros quando nenhum campo e enviado (update parcial vazio)', async () => {
    const dto = plainToInstance(UpdateUserDto, {});

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('deve continuar validando o formato do email quando ele e alterado', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      email: 'nao-e-um-email',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });
});

describe('UpdatePartialUserDto', () => {
  const baseValidPayload = {
    name: 'Vaqueiro Existente',
    email: 'vaqueiro@example.com',
    userCategory: UserCategory.Fisica,
    state: 'PE',
    city: 'Belo Jardim',
  };

  it('deve validar sem erros ao reenviar o mesmo email do registro atual', async () => {
    const dto = plainToInstance(UpdatePartialUserDto, {
      ...baseValidPayload,
      role: UserRole.VAQUEIRO,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('deve validar sem erros ao alterar apenas o nome', async () => {
    const dto = plainToInstance(UpdatePartialUserDto, {
      ...baseValidPayload,
      name: 'Nome Atualizado',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('deve validar sem erros ao alterar o cargo/perfil (role)', async () => {
    const dto = plainToInstance(UpdatePartialUserDto, {
      ...baseValidPayload,
      role: UserRole.ADMIN,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

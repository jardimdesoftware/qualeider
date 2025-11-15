import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UserCategory, UserType } from '@/domain/enums/enums';

describe('CreateUserDto', () => {
  describe('name validation', () => {
    it('deve rejeitar nome vazio', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: '',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('deve rejeitar nome com menos de 3 caracteres', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'ab',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('deve rejeitar nome com mais de 255 caracteres', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'a'.repeat(256),
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('deve aceitar nome válido', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeUndefined();
    });
  });

  describe('email validation', () => {
    it('deve rejeitar email vazio', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: '',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('deve rejeitar email inválido', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'invalid-email',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.constraints).toHaveProperty('isEmail');
    });

    it('deve transformar email para lowercase e trim', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      expect(dto.email).toBe('test@example.com');
    });

    it('deve aceitar email válido', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'joao.silva@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const emailErrors = errors.filter((e) => e.property === 'email');
      expect(emailErrors.length).toBe(0);
    });
  });

  describe('password validation', () => {
    it('deve rejeitar senha vazia', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: '',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('deve rejeitar senha com menos de 8 caracteres', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Abc@12',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('minLength');
    });

    it('deve rejeitar senha sem letra minúscula', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'SENHA@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('matches');
    });

    it('deve rejeitar senha sem letra maiúscula', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('matches');
    });

    it('deve rejeitar senha sem número', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@Abc',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('matches');
    });

    it('deve rejeitar senha sem caractere especial', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('matches');
    });

    it('deve aceitar senha válida', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const passwordErrors = errors.filter((e) => e.property === 'password');
      expect(passwordErrors.length).toBe(0);
    });
  });

  describe('userType validation', () => {
    it('deve aceitar userType válido', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userType: UserType.Pecuarista,
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const userTypeErrors = errors.filter((e) => e.property === 'userType');
      expect(userTypeErrors.length).toBe(0);
    });

    it('deve rejeitar userType inválido', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userType: 'INVALID' as any,
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const userTypeError = errors.find((e) => e.property === 'userType');
      expect(userTypeError).toBeDefined();
      expect(userTypeError?.constraints).toHaveProperty('isEnum');
    });

    it('deve aceitar userType omitido (opcional)', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const userTypeErrors = errors.filter((e) => e.property === 'userType');
      expect(userTypeErrors.length).toBe(0);
    });
  });

  describe('userCategory validation', () => {
    it('deve rejeitar userCategory vazio', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'userCategory')).toBe(true);
    });

    it('deve rejeitar userCategory inválido', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: 'INVALID' as any,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const categoryError = errors.find((e) => e.property === 'userCategory');
      expect(categoryError).toBeDefined();
      expect(categoryError?.constraints).toHaveProperty('isEnum');
    });

    it('deve aceitar userCategory válido', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const categoryErrors = errors.filter(
        (e) => e.property === 'userCategory',
      );
      expect(categoryErrors.length).toBe(0);
    });
  });

  describe('state validation', () => {
    it('deve rejeitar estado vazio', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: '',
        city: 'Recife',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'state')).toBe(true);
    });

    it('deve rejeitar estado com tamanho diferente de 2', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PER',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const stateError = errors.find((e) => e.property === 'state');
      expect(stateError).toBeDefined();
      expect(stateError?.constraints).toHaveProperty('isLength');
    });

    it('deve transformar estado para uppercase e trim', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: '  pe  ',
        city: 'Recife',
      });

      expect(dto.state).toBe('PE');
    });

    it('deve aceitar estado válido', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const stateErrors = errors.filter((e) => e.property === 'state');
      expect(stateErrors.length).toBe(0);
    });
  });

  describe('city validation', () => {
    it('deve rejeitar cidade vazia', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: '',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'city')).toBe(true);
    });

    it('deve aceitar cidade válida', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const cityErrors = errors.filter((e) => e.property === 'city');
      expect(cityErrors.length).toBe(0);
    });
  });

  describe('document validation', () => {
    it('deve aceitar documento válido', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva',
        email: 'test@example.com',
        password: 'Senha@123',
        userCategory: UserCategory.Fisica,
        document: '12345678901',
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      const documentErrors = errors.filter((e) => e.property === 'document');
      expect(documentErrors.length).toBe(0);
    });
  });

  describe('DTO completo válido', () => {
    it('deve validar DTO completo sem erros', async () => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'João Silva Santos',
        email: 'joao.silva@example.com',
        password: 'Senha@123',
        userType: UserType.Pecuarista,
        userCategory: UserCategory.Fisica,
        document: '12345678901',
        state: 'PE',
        city: 'Recife',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { Role, UserCategory, UserType } from '@/domain/enums/enums';

describe('CreateUserDto', () => {
  const runValidation = (dto: CreateUserDto) => {
    const instance = plainToInstance(CreateUserDto, dto);
    return validate(instance);
  };

  const validDto: CreateUserDto = {
    name: 'Valid Name',
    email: 'valid@email.com',
    password: 'ValidP@ss1',
    role: Role.Common,
    userType: UserType.Pecuarista,
    userCategory: UserCategory.Fisica,
    state: 'PE',
    city: 'Belo Jardim',
  };

  it('should pass validation with valid data', async () => {
    const errors = await runValidation(validDto);
    expect(errors.length).toBe(0);
  });

  describe('Password Validation', () => {
    it('should fail if password is too short', async () => {
      const dto = { ...validDto, password: 'short' };
      const errors = await runValidation(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail if password lacks an uppercase letter', async () => {
      const dto = { ...validDto, password: 'invalidp@ss1' };
      const errors = await runValidation(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should fail if password lacks a number', async () => {
      const dto = { ...validDto, password: 'InvalidP@ss' };
      const errors = await runValidation(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });
  });

  describe('Conditional Validation (userType)', () => {
    it('should fail if role is "Common" and userType is missing', async () => {
      const dto = { ...validDto, role: Role.Common };
      delete dto.userType;
      const errors = await runValidation(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass if role is not "Common" and userType is missing', async () => {
      const dto = { ...validDto, role: Role.Admin };
      delete dto.userType;
      const errors = await runValidation(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Field Validations', () => {
    it('should fail if name is shorter than 3 characters', async () => {
      const dto = { ...validDto, name: 'ab' };
      const errors = await runValidation(dto);
      expect(errors.length).toBeGreaterThan(0);
      const constraints = errors[0].constraints || {};
      expect(constraints.length || constraints.isLength).toBeDefined();
    });

    it('should fail if email is invalid', async () => {
      const dto = { ...validDto, email: 'invalid-email' };
      const errors = await runValidation(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail if state is not 2 characters long', async () => {
      const dto = { ...validDto, state: 'PER' };
      const errors = await runValidation(dto);
      expect(errors.length).toBeGreaterThan(0);
      const constraints = errors[0].constraints || {};
      expect(constraints.length || constraints.isLength).toBeDefined();
    });
  });
});

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { AnimalType } from '@/domain/enums/enums';

describe('CreateAnimalDto', () => {
  describe('name validation', () => {
    it('deve aceitar name omitido', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 5,
        userId: 1,
      });

      const errors = await validate(dto);
      const nameErrors = errors.filter((e) => e.property === 'name');
      expect(nameErrors.length).toBe(0);
    });

    it('deve aceitar name válido', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        name: 'Mimosa',
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 5,
        userId: 1,
      });

      const errors = await validate(dto);
      const nameErrors = errors.filter((e) => e.property === 'name');
      expect(nameErrors.length).toBe(0);
    });

    it('deve rejeitar name que não é string', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        name: 123 as any,
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 5,
        userId: 1,
      });

      const errors = await validate(dto);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.constraints).toHaveProperty('isString');
    });
  });

  describe('animalType validation', () => {
    it('deve rejeitar animalType vazio', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        breed: 'Holandês',
        age: 5,
        userId: 1,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'animalType')).toBe(true);
    });

    it('deve rejeitar animalType inválido', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: 'INVALID' as any,
        breed: 'Holandês',
        age: 5,
        userId: 1,
      });

      const errors = await validate(dto);
      const animalTypeError = errors.find((e) => e.property === 'animalType');
      expect(animalTypeError).toBeDefined();
      expect(animalTypeError?.constraints).toHaveProperty('isEnum');
    });

    it('deve aceitar animalType válido - Vaca', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 5,
        userId: 1,
      });

      const errors = await validate(dto);
      const animalTypeErrors = errors.filter(
        (e) => e.property === 'animalType',
      );
      expect(animalTypeErrors.length).toBe(0);
    });

    it('deve aceitar animalType válido - Cabra', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Cabra,
        breed: 'Saanen',
        age: 3,
        userId: 1,
      });

      const errors = await validate(dto);
      const animalTypeErrors = errors.filter(
        (e) => e.property === 'animalType',
      );
      expect(animalTypeErrors.length).toBe(0);
    });
  });

  describe('breed validation', () => {
    it('deve rejeitar breed vazio', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: '',
        age: 5,
        userId: 1,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'breed')).toBe(true);
    });

    it('deve rejeitar breed que não é string', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 123 as any,
        age: 5,
        userId: 1,
      });

      const errors = await validate(dto);
      const breedError = errors.find((e) => e.property === 'breed');
      expect(breedError).toBeDefined();
      expect(breedError?.constraints).toHaveProperty('isString');
    });

    it('deve aceitar breed válido', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 'Jersey',
        age: 5,
        userId: 1,
      });

      const errors = await validate(dto);
      const breedErrors = errors.filter((e) => e.property === 'breed');
      expect(breedErrors.length).toBe(0);
    });
  });

  describe('age validation', () => {
    it('deve rejeitar age vazio', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        userId: 1,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'age')).toBe(true);
    });

    it('deve rejeitar age que não é inteiro', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 5.5,
        userId: 1,
      });

      const errors = await validate(dto);
      const ageError = errors.find((e) => e.property === 'age');
      expect(ageError).toBeDefined();
      expect(ageError?.constraints).toHaveProperty('isInt');
    });

    it('deve rejeitar age menor que 1', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 0,
        userId: 1,
      });

      const errors = await validate(dto);
      const ageError = errors.find((e) => e.property === 'age');
      expect(ageError).toBeDefined();
      expect(ageError?.constraints).toHaveProperty('min');
    });

    it('deve aceitar age válido', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 10,
        userId: 1,
      });

      const errors = await validate(dto);
      const ageErrors = errors.filter((e) => e.property === 'age');
      expect(ageErrors.length).toBe(0);
    });
  });

  describe('userId validation', () => {
    it('deve rejeitar userId vazio', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 5,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'userId')).toBe(true);
    });

    it('deve rejeitar userId que não é inteiro', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 5,
        userId: 1.5,
      });

      const errors = await validate(dto);
      const userIdError = errors.find((e) => e.property === 'userId');
      expect(userIdError).toBeDefined();
      expect(userIdError?.constraints).toHaveProperty('isInt');
    });

    it('deve aceitar userId válido', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 5,
        userId: 42,
      });

      const errors = await validate(dto);
      const userIdErrors = errors.filter((e) => e.property === 'userId');
      expect(userIdErrors.length).toBe(0);
    });
  });

  describe('DTO completo válido', () => {
    it('deve validar DTO completo sem nome', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Ovelha,
        breed: 'Merino',
        age: 3,
        userId: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve validar DTO completo com nome', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        name: 'Mimosa',
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 7,
        userId: 5,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});

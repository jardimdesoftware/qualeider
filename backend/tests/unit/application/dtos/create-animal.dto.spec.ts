import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { AnimalType } from '@/domain/enums/enums';

describe('CreateAnimalDto', () => {
  describe('name validation', () => {
    it('deve aceitar name omitido', async () => {
      const dto = plainToInstance(CreateAnimalDto, { age: 5, userId: 1 });
      const errors = await validate(dto);
      const nameErrors = errors.filter((e) => e.property === 'name');
      expect(nameErrors.length).toBe(0);
    });

    it('deve aceitar name valido', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        name: 'Mimosa',
        animalType: AnimalType.Vaca,
        breed: 'Holandes',
        age: 5,
        userId: 1,
      });
      const errors = await validate(dto);
      const nameErrors = errors.filter((e) => e.property === 'name');
      expect(nameErrors.length).toBe(0);
    });

    it('deve rejeitar name que nao e string', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        name: 123 as any,
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
    it('deve aceitar animalType omitido (campo opcional)', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalSpeciesId: 1,
        age: 5,
        userId: 1,
      });
      const errors = await validate(dto);
      const animalTypeErrors = errors.filter((e) => e.property === 'animalType');
      expect(animalTypeErrors.length).toBe(0);
    });

    it('deve rejeitar animalType invalido', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: 'INVALID' as any,
        age: 5,
        userId: 1,
      });
      const errors = await validate(dto);
      const animalTypeError = errors.find((e) => e.property === 'animalType');
      expect(animalTypeError).toBeDefined();
      expect(animalTypeError?.constraints).toHaveProperty('isEnum');
    });

    it('deve aceitar animalType valido - Vaca', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Vaca,
        age: 5,
        userId: 1,
      });
      const errors = await validate(dto);
      const animalTypeErrors = errors.filter((e) => e.property === 'animalType');
      expect(animalTypeErrors.length).toBe(0);
    });

    it('deve aceitar animalType valido - Cabra', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalType: AnimalType.Cabra,
        age: 3,
        userId: 1,
      });
      const errors = await validate(dto);
      const animalTypeErrors = errors.filter((e) => e.property === 'animalType');
      expect(animalTypeErrors.length).toBe(0);
    });
  });

  describe('breed validation', () => {
    it('deve aceitar breed omitido (campo opcional)', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalSpeciesId: 1,
        age: 5,
        userId: 1,
      });
      const errors = await validate(dto);
      const breedErrors = errors.filter((e) => e.property === 'breed');
      expect(breedErrors.length).toBe(0);
    });

    it('deve rejeitar breed que nao e string', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        breed: 123 as any,
        age: 5,
        userId: 1,
      });
      const errors = await validate(dto);
      const breedError = errors.find((e) => e.property === 'breed');
      expect(breedError).toBeDefined();
      expect(breedError?.constraints).toHaveProperty('isString');
    });

    it('deve aceitar breed valido', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
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
      const dto = plainToInstance(CreateAnimalDto, { userId: 1 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'age')).toBe(true);
    });

    it('deve rejeitar age que nao e inteiro', async () => {
      const dto = plainToInstance(CreateAnimalDto, { age: 5.5, userId: 1 });
      const errors = await validate(dto);
      const ageError = errors.find((e) => e.property === 'age');
      expect(ageError).toBeDefined();
      expect(ageError?.constraints).toHaveProperty('isInt');
    });

    it('deve rejeitar age negativo', async () => {
      const dto = plainToInstance(CreateAnimalDto, { age: -1, userId: 1 });
      const errors = await validate(dto);
      const ageError = errors.find((e) => e.property === 'age');
      expect(ageError).toBeDefined();
      expect(ageError?.constraints).toHaveProperty('min');
    });

    it('deve aceitar age valido', async () => {
      const dto = plainToInstance(CreateAnimalDto, { age: 10, userId: 1 });
      const errors = await validate(dto);
      const ageErrors = errors.filter((e) => e.property === 'age');
      expect(ageErrors.length).toBe(0);
    });
  });

  describe('userId validation', () => {
    it('deve rejeitar userId vazio', async () => {
      const dto = plainToInstance(CreateAnimalDto, { age: 5 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'userId')).toBe(true);
    });

    it('deve rejeitar userId que nao e inteiro', async () => {
      const dto = plainToInstance(CreateAnimalDto, { age: 5, userId: 1.5 });
      const errors = await validate(dto);
      const userIdError = errors.find((e) => e.property === 'userId');
      expect(userIdError).toBeDefined();
      expect(userIdError?.constraints).toHaveProperty('isInt');
    });

    it('deve aceitar userId valido', async () => {
      const dto = plainToInstance(CreateAnimalDto, { age: 5, userId: 42 });
      const errors = await validate(dto);
      const userIdErrors = errors.filter((e) => e.property === 'userId');
      expect(userIdErrors.length).toBe(0);
    });
  });

  describe('DTO completo valido', () => {
    it('deve validar DTO com animalSpeciesId', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        animalSpeciesId: 1,
        breed: 'Merino',
        age: 3,
        userId: 1,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve validar DTO com animalType legado', async () => {
      const dto = plainToInstance(CreateAnimalDto, {
        name: 'Mimosa',
        animalType: AnimalType.Vaca,
        breed: 'Holandes',
        age: 7,
        userId: 5,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});

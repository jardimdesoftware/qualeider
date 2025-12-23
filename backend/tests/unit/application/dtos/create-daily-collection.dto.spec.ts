import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { MilkingPlace } from '@/domain/enums/enums';

describe('CreateDailyCollectionDto', () => {
  describe('quantity validation', () => {
    it('deve rejeitar quantity vazio', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'quantity')).toBe(true);
    });

    it('deve rejeitar quantity que não é número', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 'invalid' as any,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      const quantityError = errors.find((e) => e.property === 'quantity');
      expect(quantityError).toBeDefined();
      expect(quantityError?.constraints).toHaveProperty('isNumber');
    });

    it('deve aceitar quantity válido', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 25.5,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      const quantityErrors = errors.filter((e) => e.property === 'quantity');
      expect(quantityErrors.length).toBe(0);
    });
  });

  describe('userId validation', () => {
    it('deve rejeitar userId vazio', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'userId')).toBe(true);
    });

    it('deve rejeitar userId que não é inteiro', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1.5,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      const userIdError = errors.find((e) => e.property === 'userId');
      expect(userIdError).toBeDefined();
      expect(userIdError?.constraints).toHaveProperty('isInt');
    });

    it('deve aceitar userId válido', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      const userIdErrors = errors.filter((e) => e.property === 'userId');
      expect(userIdErrors.length).toBe(0);
    });
  });

  describe('numAnimals validation', () => {
    it('deve rejeitar numAnimals vazio', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'numAnimals')).toBe(true);
    });

    it('deve rejeitar numAnimals que não é inteiro', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5.5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      const numAnimalsError = errors.find((e) => e.property === 'numAnimals');
      expect(numAnimalsError).toBeDefined();
      expect(numAnimalsError?.constraints).toHaveProperty('isInt');
    });

    it('deve aceitar numAnimals válido', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 10,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      const numAnimalsErrors = errors.filter(
        (e) => e.property === 'numAnimals',
      );
      expect(numAnimalsErrors.length).toBe(0);
    });
  });

  describe('numOrdens validation', () => {
    it('deve rejeitar numOrdens vazio', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'numOrdens')).toBe(true);
    });

    it('deve aceitar numOrdens válido', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 3,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      const numOrdensErrors = errors.filter((e) => e.property === 'numOrdens');
      expect(numOrdensErrors.length).toBe(0);
    });
  });

  describe('rationProvided validation', () => {
    it('deve rejeitar rationProvided vazio', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'rationProvided')).toBe(true);
    });

    it('deve rejeitar rationProvided que não é booleano', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: 'yes' as any,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      const rationError = errors.find((e) => e.property === 'rationProvided');
      expect(rationError).toBeDefined();
      expect(rationError?.constraints).toHaveProperty('isBoolean');
    });

    it('deve aceitar rationProvided true', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      const rationErrors = errors.filter(
        (e) => e.property === 'rationProvided',
      );
      expect(rationErrors.length).toBe(0);
    });

    it('deve aceitar rationProvided false', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: false,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      const rationErrors = errors.filter(
        (e) => e.property === 'rationProvided',
      );
      expect(rationErrors.length).toBe(0);
    });
  });

  describe('numLactation validation', () => {
    it('deve rejeitar numLactation vazio', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'numLactation')).toBe(true);
    });

    it('deve aceitar numLactation válido', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 3,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      const lactationErrors = errors.filter(
        (e) => e.property === 'numLactation',
      );
      expect(lactationErrors.length).toBe(0);
    });
  });

  describe('milkingPlace validation', () => {
    it('deve rejeitar milkingPlace vazio', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'milkingPlace')).toBe(true);
    });

    it('deve rejeitar milkingPlace inválido', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: 'INVALID' as any,
        technicalAssistance: false,
      });

      const errors = await validate(dto);
      const milkingError = errors.find((e) => e.property === 'milkingPlace');
      expect(milkingError).toBeDefined();
      expect(milkingError?.constraints).toHaveProperty('isEnum');
    });

    it('deve aceitar milkingPlace válido - Curral', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      const milkingErrors = errors.filter((e) => e.property === 'milkingPlace');
      expect(milkingErrors.length).toBe(0);
    });

    it('deve aceitar milkingPlace válido - Aberto', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      const milkingErrors = errors.filter((e) => e.property === 'milkingPlace');
      expect(milkingErrors.length).toBe(0);
    });
  });

  describe('technicalAssistance validation', () => {
    it('deve rejeitar technicalAssistance vazio', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'technicalAssistance')).toBe(
        true,
      );
    });

    it('deve rejeitar technicalAssistance que não é booleano', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: 'yes' as any,
      });

      const errors = await validate(dto);
      const assistanceError = errors.find(
        (e) => e.property === 'technicalAssistance',
      );
      expect(assistanceError).toBeDefined();
      expect(assistanceError?.constraints).toHaveProperty('isBoolean');
    });

    it('deve aceitar technicalAssistance true', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 20,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: true,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      const assistanceErrors = errors.filter(
        (e) => e.property === 'technicalAssistance',
      );
      expect(assistanceErrors.length).toBe(0);
    });
  });

  describe('items validation', () => {
    const validDto = {
      quantity: 20,
      userId: 1,
      numAnimals: 5,
      numOrdens: 2,
      rationProvided: true,
      numLactation: 2,
      milkingPlace: MilkingPlace.Curral,
      technicalAssistance: false,
      collectionDate: new Date(),
    };

    it('deve aceitar items undefined (opcional)', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        ...validDto,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar items que não é array', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        ...validDto,
        items: 'not-an-array' as any,
      });

      const errors = await validate(dto);
      const itemsError = errors.find((e) => e.property === 'items');
      expect(itemsError).toBeDefined();
      expect(itemsError?.constraints).toHaveProperty('isArray');
    });

    it('deve validar items aninhados inválidos (quantity negativa)', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        ...validDto,
        items: [
          {
            animalId: 1,
            quantity: -5,
          },
        ],
      });

      const errors = await validate(dto);
      const itemsError = errors.find((e) => e.property === 'items');
      expect(itemsError).toBeDefined();
      expect(itemsError?.children).toBeDefined();
      expect(itemsError?.children?.length).toBeGreaterThan(0);
      
      const firstItemError = itemsError?.children?.[0];
      const quantityError = firstItemError?.children?.find(e => e.property === 'quantity');
      expect(quantityError?.constraints).toHaveProperty('min');
    });

    it('deve validar items aninhados inválidos (animalId inválido)', async () => {
        const dto = plainToInstance(CreateDailyCollectionDto, {
          ...validDto,
          items: [
            {
              animalId: 1.5,
              quantity: 10,
            },
          ],
        });
  
        const errors = await validate(dto);
        const itemsError = errors.find((e) => e.property === 'items');
        expect(itemsError).toBeDefined();
        
        const firstItemError = itemsError?.children?.[0];
        const animalIdError = firstItemError?.children?.find(e => e.property === 'animalId');
        expect(animalIdError?.constraints).toHaveProperty('isInt');
      });

    it('deve aceitar items válidos', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        ...validDto,
        items: [
          {
            animalId: 1,
            quantity: 10,
          },
          {
            animalId: 2,
            quantity: 10,
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('DTO completo válido', () => {
    it('deve validar DTO completo sem erros', async () => {
      const dto = plainToInstance(CreateDailyCollectionDto, {
        quantity: 35.7,
        userId: 2,
        numAnimals: 8,
        numOrdens: 3,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Ambos,
        technicalAssistance: true,
        collectionDate: new Date(),
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});

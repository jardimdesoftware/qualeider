import { DailyCollectionEntity } from '@/domain/entities/daily-collection.entity';
import { MilkingPlace, Status } from '@/domain/enums/enums';

describe('DailyCollectionEntity (domain)', () => {
  it('deve capturar dados de coleta', () => {
    const now = new Date();
    const d: DailyCollectionEntity = {
      id: 100,
      quantity: 23.5,
      collectionDate: now,
      userId: 1,
      numAnimals: 12,
      numOrdens: 2,
      rationProvided: true,
      numLactation: 3,
      milkingPlace: MilkingPlace.Curral,
      technicalAssistance: false,
      createdAt: now,
      updatedAt: now,
      status: Status.Active,
    };

    expect(d.quantity).toBeGreaterThan(0);
    expect(d.milkingPlace).toBe(MilkingPlace.Curral);
  });

  describe('required numeric fields', () => {
    it('deve exigir quantity (litros de leite)', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 1,
        quantity: 50.75,
        collectionDate: now,
        userId: 1,
        numAnimals: 10,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.quantity).toBe(50.75);
      expect(typeof collection.quantity).toBe('number');
    });

    it('deve permitir quantity com precisão decimal', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 2,
        quantity: 15.123456,
        collectionDate: now,
        userId: 1,
        numAnimals: 5,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.quantity).toBeCloseTo(15.123456, 6);
    });

    it('deve permitir quantity zero', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 3,
        quantity: 0,
        collectionDate: now,
        userId: 1,
        numAnimals: 0,
        numOrdens: 0,
        rationProvided: false,
        numLactation: 0,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.quantity).toBe(0);
    });
  });

  describe('numAnimals field', () => {
    it('deve rastrear número de animais ordenhados', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 4,
        quantity: 100.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 25,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 3,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: true,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.numAnimals).toBe(25);
      expect(collection.numAnimals).toBeGreaterThan(0);
    });

    it('deve permitir um único animal', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 5,
        quantity: 5.5,
        collectionDate: now,
        userId: 1,
        numAnimals: 1,
        numOrdens: 1,
        rationProvided: true,
        numLactation: 1,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.numAnimals).toBe(1);
    });
  });

  describe('numOrdens field', () => {
    it('deve rastrear número de ordenhas por dia', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 6,
        quantity: 80.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 20,
        numOrdens: 3,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Ambos,
        technicalAssistance: true,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.numOrdens).toBe(3);
    });

    it('deve permitir valores típicos (1-3 ordenhas)', () => {
      const now = new Date();
      const twoMilkings: DailyCollectionEntity = {
        id: 7,
        quantity: 60.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 15,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(twoMilkings.numOrdens).toBe(2);
      expect(twoMilkings.numOrdens).toBeGreaterThanOrEqual(1);
      expect(twoMilkings.numOrdens).toBeLessThanOrEqual(3);
    });
  });

  describe('numLactation field', () => {
    it('deve rastrear número do ciclo de lactação', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 8,
        quantity: 45.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 10,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 4,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: true,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.numLactation).toBe(4);
      expect(collection.numLactation).toBeGreaterThan(0);
    });

    it('deve permitir primeira lactação', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 9,
        quantity: 20.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.numLactation).toBe(1);
    });
  });

  describe('boolean fields', () => {
    it('deve rastrear se ração foi fornecida', () => {
      const now = new Date();
      const withRation: DailyCollectionEntity = {
        id: 10,
        quantity: 70.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 15,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(withRation.rationProvided).toBe(true);
      expect(typeof withRation.rationProvided).toBe('boolean');
    });

    it('deve rastrear se assistência técnica estava disponível', () => {
      const now = new Date();
      const withAssistance: DailyCollectionEntity = {
        id: 11,
        quantity: 90.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 20,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 3,
        milkingPlace: MilkingPlace.Ambos,
        technicalAssistance: true,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(withAssistance.technicalAssistance).toBe(true);
    });

    it('deve permitir ambos booleanos como false', () => {
      const now = new Date();
      const minimal: DailyCollectionEntity = {
        id: 12,
        quantity: 30.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 8,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(minimal.rationProvided).toBe(false);
      expect(minimal.technicalAssistance).toBe(false);
    });
  });

  describe('milkingPlace values', () => {
    it('deve suportar local de ordenha Aberto', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 13,
        quantity: 35.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 10,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.milkingPlace).toBe(MilkingPlace.Aberto);
    });

    it('deve suportar local de ordenha Curral', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 14,
        quantity: 55.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 12,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: true,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.milkingPlace).toBe(MilkingPlace.Curral);
    });

    it('deve suportar local de ordenha Ambos', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 15,
        quantity: 75.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 18,
        numOrdens: 3,
        rationProvided: true,
        numLactation: 3,
        milkingPlace: MilkingPlace.Ambos,
        technicalAssistance: true,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.milkingPlace).toBe(MilkingPlace.Ambos);
    });
  });

  describe('userId relationship', () => {
    it('deve pertencer a um usuário (produtor)', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 16,
        quantity: 40.0,
        collectionDate: now,
        userId: 99,
        numAnimals: 10,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.userId).toBe(99);
      expect(typeof collection.userId).toBe('number');
    });
  });

  describe('collectionDate field', () => {
    it('deve registrar a data da coleta', () => {
      const collectionDate = new Date('2025-11-14T06:00:00Z');
      const now = new Date();

      const collection: DailyCollectionEntity = {
        id: 17,
        quantity: 65.0,
        collectionDate: collectionDate,
        userId: 1,
        numAnimals: 15,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: true,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.collectionDate).toBeInstanceOf(Date);
      expect(collection.collectionDate).toEqual(collectionDate);
    });

    it('deve permitir datas passadas', () => {
      const pastDate = new Date('2025-01-01');
      const now = new Date();

      const collection: DailyCollectionEntity = {
        id: 18,
        quantity: 50.0,
        collectionDate: pastDate,
        userId: 1,
        numAnimals: 12,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.collectionDate.getTime()).toBeLessThan(now.getTime());
    });
  });

  describe('timestamps', () => {
    it('deve ter timestamps createdAt e updatedAt', () => {
      const now = new Date();
      const collection: DailyCollectionEntity = {
        id: 19,
        quantity: 45.0,
        collectionDate: now,
        userId: 1,
        numAnimals: 10,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        createdAt: now,
        updatedAt: now,
        status: Status.Active,
      };

      expect(collection.createdAt).toBeInstanceOf(Date);
      expect(collection.updatedAt).toBeInstanceOf(Date);
      expect(collection.createdAt).toEqual(collection.updatedAt);
    });

    it('deve permitir valores diferentes de createdAt e updatedAt', () => {
      const createdDate = new Date('2025-11-01');
      const updatedDate = new Date('2025-11-14');
      const collectionDate = new Date('2025-11-01');

      const collection: DailyCollectionEntity = {
        id: 20,
        quantity: 55.0,
        collectionDate: collectionDate,
        userId: 1,
        numAnimals: 13,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Ambos,
        technicalAssistance: true,
        createdAt: createdDate,
        updatedAt: updatedDate,
        status: Status.Active,
      };

      expect(collection.updatedAt.getTime()).toBeGreaterThan(
        collection.createdAt.getTime(),
      );
    });
  });
});

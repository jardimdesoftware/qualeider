import { AnimalEntity } from '@/domain/entities/animal.entity';
import { AnimalType, Status } from '@/domain/enums/enums';

describe('AnimalEntity (domain)', () => {
  it('deve armazenar campos básicos do animal', () => {
    const now = new Date();
    const animal: AnimalEntity = {
      id: 10,
      name: 'Estrela',
      animalType: AnimalType.Vaca,
      breed: 'Holandesa',
      age: 5,
      userId: 1,
      status: Status.Active,
      createdAt: now,
      updatedAt: now,
    };

    expect(animal.animalType).toBe(AnimalType.Vaca);
    expect(animal.breed).toBe('Holandesa');
  });

  describe('required fields', () => {
    it('deve exigir name, type, userId e status', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 1,
        name: 'Mimosa',
        animalType: AnimalType.Vaca,
        breed: 'Jersey',
        age: 3,
        userId: 100,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.name).toBe('Mimosa');
      expect(animal.animalType).toBeDefined();
      expect(animal.userId).toBe(100);
      expect(animal.status).toBe(Status.Active);
    });
  });

  describe('animalType values', () => {
    it('deve suportar tipo Vaca', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 2,
        name: 'Margarida',
        animalType: AnimalType.Vaca,
        breed: 'Gir',
        age: 4,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.animalType).toBe(AnimalType.Vaca);
    });

    it('deve suportar tipo Cabra', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 3,
        name: 'Branquinha',
        animalType: AnimalType.Cabra,
        breed: 'Saanen',
        age: 2,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.animalType).toBe(AnimalType.Cabra);
    });

    it('deve suportar tipo Ovelha', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 4,
        name: 'Lã Branca',
        animalType: AnimalType.Ovelha,
        breed: 'Merino',
        age: 3,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.animalType).toBe(AnimalType.Ovelha);
    });

    it('deve suportar tipo Bufala', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 5,
        name: 'Forte',
        animalType: AnimalType.Bufala,
        breed: 'Murrah',
        age: 6,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.animalType).toBe(AnimalType.Bufala);
    });

    it('deve suportar tipo Outro', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 6,
        name: 'Especial',
        animalType: AnimalType.Outro,
        breed: 'Mista',
        age: 2,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.animalType).toBe(AnimalType.Outro);
    });
  });

  describe('optional breed field', () => {
    it('deve permitir animal com raça', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 7,
        name: 'Raça Pura',
        animalType: AnimalType.Vaca,
        breed: 'Holandesa',
        age: 5,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.breed).toBe('Holandesa');
    });

    it('deve permitir raça com string vazia', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 8,
        name: 'Sem Raça',
        animalType: AnimalType.Vaca,
        breed: '',
        age: 4,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.breed).toBe('');
    });


  });

  describe('optional age field', () => {
    it('deve permitir animal com idade', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 10,
        name: 'Jovem',
        animalType: AnimalType.Vaca,
        breed: 'Jersey',
        age: 2,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.age).toBe(2);
      expect(animal.age).toBeGreaterThan(0);
    });

    it('deve permitir idade zero', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 11,
        name: 'Recém Nascido',
        animalType: AnimalType.Ovelha,
        breed: 'Suffolk',
        age: 0,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.age).toBe(0);
    });


  });

  describe('userId relationship', () => {
    it('deve pertencer a um usuário (produtor)', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 13,
        name: 'Propriedade',
        animalType: AnimalType.Vaca,
        breed: 'Gir',
        age: 5,
        userId: 42,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.userId).toBe(42);
      expect(typeof animal.userId).toBe('number');
    });
  });

  describe('status values', () => {
    it('deve suportar status Active', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 17,
        name: 'Ativo',
        animalType: AnimalType.Vaca,
        breed: 'Jersey',
        age: 3,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.status).toBe(Status.Active);
    });

    it('deve suportar status Inactive', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 18,
        name: 'Inativo',
        animalType: AnimalType.Cabra,
        breed: 'Parda Alpina',
        age: 7,
        userId: 1,
        status: Status.Inactive,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.status).toBe(Status.Inactive);
    });
  });

  describe('timestamps', () => {
    it('deve ter timestamps createdAt e updatedAt', () => {
      const now = new Date();
      const animal: AnimalEntity = {
        id: 19,
        name: 'Timestamp Test',
        animalType: AnimalType.Vaca,
        breed: 'Gir',
        age: 4,
        userId: 1,
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(animal.createdAt).toBeInstanceOf(Date);
      expect(animal.updatedAt).toBeInstanceOf(Date);
      expect(animal.createdAt).toEqual(animal.updatedAt);
    });

    it('deve permitir valores diferentes de createdAt e updatedAt', () => {
      const createdDate = new Date('2024-01-01');
      const updatedDate = new Date('2025-11-14');

      const animal: AnimalEntity = {
        id: 20,
        name: 'Atualizado',
        animalType: AnimalType.Bufala,
        breed: 'Jafarabadi',
        age: 5,
        userId: 1,
        status: Status.Active,
        createdAt: createdDate,
        updatedAt: updatedDate,
      };

      expect(animal.updatedAt.getTime()).toBeGreaterThan(
        animal.createdAt.getTime(),
      );
    });
  });
});

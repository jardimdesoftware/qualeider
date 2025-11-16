import {
  UserType,
  UserCategory,
  AnimalType,
  MilkingPlace,
  Status,
} from '@/domain/enums/enums';

describe('Domain Enums', () => {
  describe('UserType', () => {
    it('deve ter valor Pecuarista', () => {
      expect(UserType.Pecuarista).toBe('Pecuarista');
    });

    it('deve ter valor Cooperativa', () => {
      expect(UserType.Cooperativa).toBe('Cooperativa');
    });

    it('deve ter valor Associacao', () => {
      expect(UserType.Associacao).toBe('Associacao');
    });

    it('deve ter valor Outro', () => {
      expect(UserType.Outro).toBe('Outro');
    });

    it('deve ter exatamente 4 valores', () => {
      const values = Object.values(UserType);
      expect(values).toHaveLength(4);
      expect(values).toEqual([
        'Pecuarista',
        'Cooperativa',
        'Associacao',
        'Outro',
      ]);
    });

    it('deve ser atribuível a variável string', () => {
      const userType: string = UserType.Pecuarista;
      expect(typeof userType).toBe('string');
    });
  });

  describe('UserCategory', () => {
    it('deve ter valor Fisica', () => {
      expect(UserCategory.Fisica).toBe('Fisica');
    });

    it('deve ter valor Juridica', () => {
      expect(UserCategory.Juridica).toBe('Juridica');
    });

    it('deve ter exatamente 2 valores', () => {
      const values = Object.values(UserCategory);
      expect(values).toHaveLength(2);
      expect(values).toEqual(['Fisica', 'Juridica']);
    });

    it('deve distinguir entre pessoas físicas e jurídicas', () => {
      expect(UserCategory.Fisica).not.toBe(UserCategory.Juridica);
    });
  });

  describe('AnimalType', () => {
    it('deve ter valor Vaca', () => {
      expect(AnimalType.Vaca).toBe('Vaca');
    });

    it('deve ter valor Cabra', () => {
      expect(AnimalType.Cabra).toBe('Cabra');
    });

    it('deve ter valor Ovelha', () => {
      expect(AnimalType.Ovelha).toBe('Ovelha');
    });

    it('deve ter valor Bufala', () => {
      expect(AnimalType.Bufala).toBe('Bufala');
    });

    it('deve ter valor Outro', () => {
      expect(AnimalType.Outro).toBe('Outro');
    });

    it('deve ter exatamente 5 valores', () => {
      const values = Object.values(AnimalType);
      expect(values).toHaveLength(5);
      expect(values).toEqual(['Vaca', 'Cabra', 'Ovelha', 'Bufala', 'Outro']);
    });

    it('deve suportar todos os animais produtores de leite comuns', () => {
      const milkProducers = [
        AnimalType.Vaca,
        AnimalType.Cabra,
        AnimalType.Ovelha,
        AnimalType.Bufala,
      ];

      expect(milkProducers).toHaveLength(4);
      milkProducers.forEach((type) => {
        expect(type).toBeDefined();
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('MilkingPlace', () => {
    it('deve ter valor Aberto', () => {
      expect(MilkingPlace.Aberto).toBe('Aberto');
    });

    it('deve ter valor Curral', () => {
      expect(MilkingPlace.Curral).toBe('Curral');
    });

    it('deve ter valor Ambos', () => {
      expect(MilkingPlace.Ambos).toBe('Ambos');
    });

    it('deve ter exatamente 3 valores', () => {
      const values = Object.values(MilkingPlace);
      expect(values).toHaveLength(3);
      expect(values).toEqual(['Aberto', 'Curral', 'Ambos']);
    });

    it('deve distinguir entre ordenha aberta e fechada', () => {
      expect(MilkingPlace.Aberto).not.toBe(MilkingPlace.Curral);
      expect(MilkingPlace.Ambos).not.toBe(MilkingPlace.Aberto);
      expect(MilkingPlace.Ambos).not.toBe(MilkingPlace.Curral);
    });

    it('deve permitir alternar entre locais de ordenha', () => {
      let location: MilkingPlace = MilkingPlace.Aberto;
      expect(location).toBe('Aberto');

      location = MilkingPlace.Curral;
      expect(location).toBe('Curral');

      location = MilkingPlace.Ambos;
      expect(location).toBe('Ambos');
    });
  });

  describe('Status', () => {
    it('deve ter valor Active', () => {
      expect(Status.Active).toBe('Active');
    });

    it('deve ter valor Inactive', () => {
      expect(Status.Inactive).toBe('Inactive');
    });

    it('deve ter exatamente 2 valores', () => {
      const values = Object.values(Status);
      expect(values).toHaveLength(2);
      expect(values).toEqual(['Active', 'Inactive']);
    });

    it('deve distinguir ativo de inativo', () => {
      expect(Status.Active).not.toBe(Status.Inactive);
    });

    it('deve permitir alternar status', () => {
      let status: Status = Status.Active;
      expect(status).toBe('Active');

      status = Status.Inactive;
      expect(status).toBe('Inactive');
    });

    it('deve ser usável em condicionais', () => {
      const activeStatus = Status.Active;
      const inactiveStatus = Status.Inactive;

      if (activeStatus === Status.Active) {
        expect(true).toBe(true); // Active path
      } else {
        fail('Should be active');
      }

      if (inactiveStatus === Status.Inactive) {
        expect(true).toBe(true); // Inactive path
      } else {
        fail('Should be inactive');
      }
    });
  });

  describe('Enum consistency', () => {
    it('deve usar padrão de nomenclatura consistente para Status', () => {
      // Status uses English names
      expect(Status.Active).toBe('Active');
      expect(Status.Inactive).toBe('Inactive');
    });

    it('deve usar padrão de nomenclatura consistente para locais', () => {
      // MilkingPlace uses Portuguese names
      expect(MilkingPlace.Aberto).toBe('Aberto');
      expect(MilkingPlace.Curral).toBe('Curral');
    });

    it('deve usar padrão de nomenclatura consistente para tipos', () => {
      // AnimalType and UserType use Portuguese names
      expect(AnimalType.Vaca).toBe('Vaca');
      expect(UserType.Pecuarista).toBe('Pecuarista');
      expect(UserCategory.Fisica).toBe('Fisica');
    });

    it('devem todos ser enums string', () => {
      expect(typeof UserType.Pecuarista).toBe('string');
      expect(typeof UserCategory.Fisica).toBe('string');
      expect(typeof AnimalType.Vaca).toBe('string');
      expect(typeof MilkingPlace.Aberto).toBe('string');
      expect(typeof Status.Active).toBe('string');
    });
  });

  describe('Enum type safety', () => {
    it('deve garantir type safety de UserType', () => {
      const validUserType: UserType = UserType.Pecuarista;
      expect(validUserType).toBe('Pecuarista');

      // TypeScript prevents: const invalid: UserType = 'InvalidValue';
    });

    it('deve garantir type safety de AnimalType', () => {
      const validAnimalType: AnimalType = AnimalType.Vaca;
      expect(validAnimalType).toBe('Vaca');
    });

    it('deve garantir type safety de MilkingPlace', () => {
      const validPlace: MilkingPlace = MilkingPlace.Curral;
      expect(validPlace).toBe('Curral');
    });

    it('deve garantir type safety de Status', () => {
      const validStatus: Status = Status.Active;
      expect(validStatus).toBe('Active');
    });

    it('deve garantir type safety de UserCategory', () => {
      const validCategory: UserCategory = UserCategory.Fisica;
      expect(validCategory).toBe('Fisica');
    });
  });
});

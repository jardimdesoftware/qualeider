interface AssociationEntity {
  id: number;
  name: string;
  tradeName?: string | null;
  cnpj: string;
  email: string;
  password: string;
  city: string;
  state: string;
  foundationDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AssociationFactory {
  private static counter = 1;

  static create(overrides?: Partial<AssociationEntity>): AssociationEntity {
    const id = overrides?.id ?? this.counter++;
    const now = new Date();

    return {
      id,
      name: `Associação de Produtores ${id}`,
      tradeName: `APROD${id}`,
      cnpj: `1234567800019${id}`,
      email: `associacao${id}@example.com`,
      password: '$2a$10$hashedPasswordExample123456789', // bcrypt hash mock
      city: 'Belo Jardim',
      state: 'PE',
      foundationDate: new Date('2020-01-01'),
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  static createMany(count: number): AssociationEntity[] {
    return Array.from({ length: count }, () => this.create());
  }

  static reset() {
    this.counter = 1;
  }
}

export const createAssociation = (overrides?: Partial<AssociationEntity>) => {
  return AssociationFactory.create(overrides);
};

export const createManyAssociations = (count: number) => {
  return AssociationFactory.createMany(count);
};

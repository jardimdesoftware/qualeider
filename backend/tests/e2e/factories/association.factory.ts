import { CoverageArea } from '@prisma/client';

export interface AssociationFactoryData {
  name?: string;
  tradeName?: string;
  cnpj?: string;
  stateRegistration?: string;
  email?: string;
  password?: string;
  phone?: string;
  landlinePhone?: string;
  mobilePhone?: string;
  website?: string;
  zipCode?: string;
  state?: string;
  city?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  foundationDate?: string;
  numberOfMembers?: number;
  coverageArea?: CoverageArea;
  presidentName?: string;
  presidentCpf?: string;
  presidentEmail?: string;
  presidentPhone?: string;
}

export class AssociationFactory {
  private static counter = 0;

  static build(overrides: AssociationFactoryData = {}): AssociationFactoryData {
    this.counter++;

    return {
      name: `Associação Teste ${this.counter}`,
      cnpj: this.generateCNPJ(),
      email: `associacao${this.counter}@test.com`,
      password: 'Test@1234',
      phone: '8737211234',
      landlinePhone: '8737211234',
      mobilePhone: '87999999999',
      zipCode: '55155000',
      state: 'SP',
      city: 'São Paulo',
      street: 'Rua Teste',
      number: '123',
      neighborhood: 'Centro',
      coverageArea: CoverageArea.Municipal,
      presidentName: `Presidente ${this.counter}`,
      presidentCpf: this.generateCPF(),
      presidentEmail: `presidente${this.counter}@test.com`,
      presidentPhone: '87999999999',
      numberOfMembers: 50,
      ...overrides,
    };
  }

  static buildMunicipal(
    overrides: AssociationFactoryData = {},
  ): AssociationFactoryData {
    return this.build({
      coverageArea: CoverageArea.Municipal,
      numberOfMembers: 30,
      ...overrides,
    });
  }

  static buildRegional(
    overrides: AssociationFactoryData = {},
  ): AssociationFactoryData {
    return this.build({
      coverageArea: CoverageArea.Regional,
      numberOfMembers: 100,
      ...overrides,
    });
  }

  static buildEstadual(
    overrides: AssociationFactoryData = {},
  ): AssociationFactoryData {
    return this.build({
      coverageArea: CoverageArea.Estadual,
      numberOfMembers: 500,
      ...overrides,
    });
  }

  private static generateCNPJ(): string {
    const part1 = String(this.counter).padStart(8, '0');
    const part2 = '0001';
    const part3 = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    return `${part1}${part2}${part3}`;
  }

  private static generateCPF(): string {
    const part1 = String(this.counter).padStart(9, '0');
    const part2 = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    return `${part1}${part2}`;
  }

  static reset(): void {
    this.counter = 0;
  }
}

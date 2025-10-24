export enum Role {
  Admin = 'Admin',
  Common = 'Common',
}

export enum UserType {
  Pecuarista = 'Pecuarista',
  Cooperativa = 'Cooperativa',
  Associacao = 'Associacao',
  Outro = 'Outro',
}

export enum UserCategory {
  Fisica = 'Fisica',
  Juridica = 'Juridica',
}

export enum AnimalType {
  Vaca = 'Vaca',
  Cabra = 'Cabra',
  Ovelha = 'Ovelha',
  Bufala = 'Bufala',
  Outro = 'Outro',
}

export enum MilkingPlace {
  Aberto = 'Aberto',
  Curral = 'Curral',
  Ambos = 'Ambos',
}

export enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
}

export type ID = number;

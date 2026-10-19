export enum UserRole {
  ADMIN = 'ADMIN',
  VAQUEIRO = 'VAQUEIRO',
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

export enum CmtResult {
  Normal = 'Normal',
  Suspeito = 'Suspeito',
  Positivo = 'Positivo',
}

export enum ActivityEventType {
  LOGIN = 'LOGIN',
  DAILY_COLLECTION_CREATED = 'DAILY_COLLECTION_CREATED',
  DAILY_COLLECTION_UPDATED = 'DAILY_COLLECTION_UPDATED',
  ANIMAL_CREATED = 'ANIMAL_CREATED',
  ANIMAL_UPDATED = 'ANIMAL_UPDATED',
}

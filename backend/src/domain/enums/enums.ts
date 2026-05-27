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

export enum InviteAction {
  ACCEPT = 'Accept',
  DECLINE = 'Decline',
}

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

export enum NotificationType {
  INDIVIDUAL = 'Individual', 
  COLLECTIVE = 'Collective',       
}

export type ID = number;

export enum CoverageArea {
  Municipal = 'Municipal',
  Regional = 'Regional',
  Estadual = 'Estadual',
}

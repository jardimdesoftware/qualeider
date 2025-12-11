export enum UserType {
  Pecuarista = "Pecuarista",
  Cooperativa = "Cooperativa",
  Associacao = "Associacao",
  Outro = "Outro",
}

export enum UserCategory {
  Fisica = "Fisica",
  Juridica = "Juridica",
}

export enum Status {
  Active = "Active",
  Inactive = "Inactive",
}

export interface User {
  id: number;
  associationId?: number;
  name: string;
  email: string;
  userType?: UserType;
  userCategory: UserCategory;
  document?: string; // CPF or CNPJ
  city: string;
  state: string;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateUserDto = Omit<
  User,
  "id" | "status" | "createdAt" | "updatedAt"
> & {
  password: string;
};

export interface UserQuery {
  associationId?: number;
  status?: Status;
  emailContains?: string;
  page?: number;
  limit?: number;
}

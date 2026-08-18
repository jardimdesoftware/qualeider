export enum CoverageArea {
  Municipal = "Municipal",
  Regional = "Regional",
  Estadual = "Estadual",
}

export enum Status {
  Active = "Active",
  Inactive = "Inactive",
}

export interface Association {
  id: number;
  name: string;
  tradeName?: string;
  cnpj: string;
  stateRegistration?: string;
  email: string;
  landlinePhone: string;
  mobilePhone?: string;
  website?: string;
  zipCode: string;
  state: string;
  city: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  foundationDate?: string;
  numberOfMembers?: number;
  coverageArea: CoverageArea; // Enum
  presidentName: string;
  presidentCpf: string;
  presidentEmail: string;
  presidentPhone: string;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAssociationDto = Omit<
  Association,
  "id" | "status" | "createdAt" | "updatedAt"
> & {
  password: string;
};

export interface AssociateResponse {
  data: {
    id: number;
    name: string;
    city: string;
    state: string;
    status: string;
    animalsCount: number;
    dailyProduction: number | null;
    lastAccess: Date | null;
  }[];
  total: number;
}

export interface HerdStats {
  totalAnimals: number;
  totalMilkDay: number;
  avgProduction: number;
  heifers: number;
  calves: number;
  lactatingCows: number;
  dryCows: number;
  averageAnimalAge: number;
  totalMilkingThisMonth: number;
  rationProvidedPercentage: number;
  averageLactationsThisMonth: number;
  breedDistribution: {
    name: string;
    value: number;
  }[];
  productionHistory: {
    date: string;
    quantity: number;
  }[];
}

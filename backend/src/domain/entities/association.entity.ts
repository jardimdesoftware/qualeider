import { CoverageArea, Status } from '@/domain/enums/enums';

export class AssociationEntity {
  constructor(props?: Partial<AssociationEntity>) {
    if (props) Object.assign(this, props);
  }

  id!: number;
  name!: string;
  tradeName?: string | null;
  email!: string;
  password!: string;
  cnpj!: string;
  stateRegistration?: string | null;
  landlinePhone!: string;
  mobilePhone?: string | null;
  website?: string | null;
  zipCode!: string;
  state!: string;
  city!: string;
  street!: string;
  number!: string;
  complement?: string | null;
  neighborhood!: string;
  foundationDate?: Date | null;
  numberOfMembers?: number | null;
  coverageArea!: CoverageArea;
  presidentName!: string;
  presidentCpf!: string;
  presidentEmail!: string;
  presidentPhone!: string;
  status!: Status;
  createdAt!: Date;
  updatedAt!: Date;
}

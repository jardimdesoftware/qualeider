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
  zipCode?: string | null;
  state!: string;
  city!: string;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  foundationDate?: Date | null;
  numberOfMembers?: number | null;
  coverageArea!: CoverageArea;
  presidentName?: string | null;
  presidentCpf?: string | null;
  presidentEmail?: string | null;
  presidentPhone?: string | null;
  status!: Status;
  createdAt!: Date;
  updatedAt!: Date;
}

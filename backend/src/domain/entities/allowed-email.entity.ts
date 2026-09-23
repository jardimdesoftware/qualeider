import { ID } from '@/domain/enums/enums';

export class AllowedEmailEntity {
  constructor(props?: Partial<AllowedEmailEntity>) {
    if (props) Object.assign(this, props);
  }
  id!: ID;
  email!: string;
  createdAt!: Date;
}

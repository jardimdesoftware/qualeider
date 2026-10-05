import { ID } from '@/domain/enums/enums';

export class AllowedEmailEntity {
  constructor(props?: Partial<AllowedEmailEntity>) {
    if (props) Object.assign(this, props);
  }
  id!: ID;
  email!: string;
  /** Admin que liberou o email; nulo em liberações anteriores ao vínculo. */
  adminId?: ID | null;
  createdAt!: Date;
}

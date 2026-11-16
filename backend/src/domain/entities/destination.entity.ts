import { ID } from '@/domain/enums/enums';

export class DestinationEntity {
  constructor(props?: Partial<DestinationEntity>) {
    if (props) Object.assign(this, props);
  }
  id!: ID;
  name!: string;
  description?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

import { ID } from '@/domain/enums/enums';

export class BreedEntity {
  constructor(props?: Partial<BreedEntity>) {
    if (props) Object.assign(this, props);
  }
  id!: ID;
  name!: string;
  description?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

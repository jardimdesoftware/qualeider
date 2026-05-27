import { ID } from '@/domain/enums/enums';

export class AnimalSpeciesEntity {
  constructor(props?: Partial<AnimalSpeciesEntity>) {
    if (props) Object.assign(this, props);
  }
  id!: ID;
  name!: string;
  description?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

import { AnimalType, ID, Status } from '@/domain/enums/enums';

export class AnimalEntity {
  constructor(props?: Partial<AnimalEntity>) {
    if (props) Object.assign(this, props);
  }
  id!: ID;
  name?: string | null;
  animalType?: AnimalType | null;
  animalSpeciesId?: ID | null;
  breed?: string | null;
  breedId?: ID | null;
  age!: number;
  userId!: ID;
  status!: Status;
  createdAt!: Date;
  updatedAt!: Date;
}

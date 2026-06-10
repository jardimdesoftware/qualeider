import { AnimalType, ID, Status } from '@/domain/enums/enums';

export class AnimalEntity {
  constructor(props?: Partial<AnimalEntity>) {
    if (props) Object.assign(this, props);
  }
  id!: ID;
  tagNumber?: string | null;
  name?: string | null;
  animalType?: AnimalType | null;
  animalSpeciesId?: ID | null;
  animalSpecies?: {
    id: ID;
    name: string;
    description?: string | null;
  } | null;
  breed?: string | null;
  breedId?: ID | null;
  age!: number;
  userId!: ID;
  status!: Status;

  // Parentesco - Mae
  motherId?: ID | null;
  motherCode?: string | null;
  mother?: Partial<AnimalEntity> | null;

  // Parentesco - Pai/Reprodutor
  fatherId?: ID | null;
  fatherCode?: string | null;
  father?: Partial<AnimalEntity> | null;

  createdAt!: Date;
  updatedAt!: Date;
}

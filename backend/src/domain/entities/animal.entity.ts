import { AnimalType, ID, Status } from '@/domain/enums/enums';

export class AnimalEntity {
  id!: ID;
  name?: string | null;
  animalType!: AnimalType;
  breed!: string;
  age!: number;
  userId!: ID;
  status!: Status;
  createdAt!: Date;
  updatedAt!: Date;
}

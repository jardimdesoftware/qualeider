import { ID, MilkingPlace } from '@/domain/enums/enums';

export class DailyCollectionEntity {
  id!: ID;
  quantity!: number;
  collectionDate!: Date;
  userId!: ID;
  numAnimals!: number;
  numOrdens!: number;
  rationProvided!: boolean;
  numLactation!: number;
  milkingPlace!: MilkingPlace;
  technicalAssistance!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

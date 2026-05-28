import { ID, MilkingPlace, Status, CmtResult } from '@/domain/enums/enums';

export class DailyCollectionEntity {
  constructor(props?: Partial<DailyCollectionEntity>) {
    if (props) Object.assign(this, props);
  }
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
  status!: Status;
  createdAt!: Date;
  updatedAt!: Date;
  items?: DailyCollectionItem[];
}

export interface DailyCollectionItem {
  id: ID;
  dailyCollectionId: ID;
  animalId: ID;
  quantity: number;
  cmtResult?: CmtResult | null;
  animal?: {
    id: ID;
    name?: string | null;
    tagNumber?: string | null;
  };
}

import { ID, UserCategory, UserType, Status } from '@/domain/enums/enums';

export class UserEntity {
  constructor(props?: Partial<UserEntity>) {
    if (props) Object.assign(this, props);
  }

  id!: ID;
  associationId?: number | null;
  name!: string;
  email!: string;
  password!: string;
  userType?: UserType;
  userCategory!: UserCategory;
  document?: string | null;
  city!: string;
  state!: string;
  status!: Status;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

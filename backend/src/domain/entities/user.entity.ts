import { ID, UserCategory, UserType, Status } from '@/domain/enums/enums';

export class UserEntity {
  id!: ID;
  name!: string;
  email!: string;
  password!: string;
  userType?: UserType;
  userCategory!: UserCategory;
  city!: string;
  state!: string;
  status!: Status;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

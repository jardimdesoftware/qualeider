import { ID, Role, UserCategory, UserType, Status } from '@/domain/enums/enums';

export class UserEntity {
  id!: ID;
  name!: string;
  email!: string;
  password!: string;
  role!: Role;
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

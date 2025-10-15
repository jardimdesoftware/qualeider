import { Role, UserCategory, UserType } from '@/domain/enums/enums';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role; // default Common
  userType?: UserType;
  userCategory: UserCategory;
  city: string;
  state: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  userType?: UserType | null;
  userCategory?: UserCategory;
  city?: string;
  state?: string;
}

export class User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  userType?: string;
  userCategory: string;
  city: string;
  state: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface User {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Common";
  userType: string | null;
  userCategory: string;
  city: string;
  state: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

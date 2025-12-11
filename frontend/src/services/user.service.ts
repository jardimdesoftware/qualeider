import { apiBase } from "./baseApi";
import { CreateUserDto, User, UserQuery } from "@/interfaces/user";

class UserService {
  private static readonly RESOURCE = "/users";

  async create(data: CreateUserDto): Promise<User> {
    const response = await apiBase.post(UserService.RESOURCE, data);
    // Backend returns { statusCode, message, data: User } for create
    return response.data.data;
  }

  async checkEmail(email: string): Promise<boolean> {
    const { data } = await apiBase.get<{ exists: boolean }>(
      `${UserService.RESOURCE}/check-email`,
      { params: { email } }
    );
    return data.exists;
  }

  async findAll(params?: UserQuery, signal?: AbortSignal): Promise<User[]> {
    // Backend returns User[] directly for findAll (based on UsersController impl)
    const { data } = await apiBase.get<User[]>(UserService.RESOURCE, {
      params,
      signal,
    });
    return data;
  }

  async findById(id: number): Promise<User> {
    const { data } = await apiBase.get<User>(`${UserService.RESOURCE}/${id}`);
    return data;
  }
}

export const userService = new UserService();
// Keep export for backward compatibility if needed, but better to migrate to 'userService' instance
export const UserServiceLegacy = {
  create: userService.create.bind(userService),
  checkEmail: userService.checkEmail.bind(userService),
  findAll: userService.findAll.bind(userService),
  findById: userService.findById.bind(userService),
};
// Re-export as 'UserService' to maintain compatibility with existing code imports
export { UserServiceLegacy as UserService };


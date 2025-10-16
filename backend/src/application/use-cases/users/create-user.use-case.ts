import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { CreateUserInput } from '@/application/dtos/user.dto';
import { Role, Status } from '@/domain/enums/enums';
import { UserEntity } from '@/domain/entities/user.entity';

export class CreateUserUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hash: IHashService,
  ) {}

  async execute(input: CreateUserInput): Promise<Omit<UserEntity, 'password'>> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new Error('Email já está em uso.');
    }

    const password = await this.hash.hash(input.password, 10);
    const role = input.role ?? Role.Common;

    const created = await this.users.create({
      name: input.name,
      email: input.email,
      password,
      role,
      userType: input.userType,
      userCategory: input.userCategory,
      city: input.city,
      state: input.state,
      status: Status.Active,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: 0, // will be ignored by repository on create
    } as any);

    const { password: _p, ...withoutPassword } = created as any;
    return withoutPassword;
  }
}

import { CreateUserUseCase } from '@/application/use-cases/users/create-user.use-case';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { CreateUserInput } from '@/application/dtos/user.dto';
import { Role, UserCategory } from '@/domain/enums/enums';

const mockUserRepository: IUserRepository = {
  create: jest.fn(),
  findAllActive: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  partialUpdate: jest.fn(),
  softDelete: jest.fn(),
  findByEmail: jest.fn(),
};

const mockHashService: IHashService = {
  hash: jest.fn(),
  compare: jest.fn(),
};

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateUserUseCase(mockUserRepository, mockHashService);
  });

  it('should create a user successfully', async () => {
    const input: CreateUserInput = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'StrongP@ss1',
      role: Role.Common,
      userCategory: UserCategory.Fisica,
      city: 'City',
      state: 'ST',
    };

    const hashedPassword = 'hashed_password';
    const createdUser = { ...input, id: 1, password: hashedPassword };

    (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null); 
    (mockHashService.hash as jest.Mock).mockResolvedValue(hashedPassword);
    (mockUserRepository.create as jest.Mock).mockResolvedValue(createdUser);

    const result = await useCase.execute(input);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mockHashService.hash).toHaveBeenCalledWith(input.password, 10);
    expect(mockUserRepository.create).toHaveBeenCalled();
    expect(result).not.toHaveProperty('password'); 
    expect(result.email).toBe(input.email);
  });

  it('should assign Role.Common as default when role is not provided', async () => {
    const input: Omit<CreateUserInput, 'role'> = {
      name: 'Default Role User',
      email: 'default@example.com',
      password: 'StrongP@ss1',
      userCategory: UserCategory.Fisica,
      city: 'City',
      state: 'ST',
    };

    const hashedPassword = 'hashed_password';
    const createdUser = { ...input, id: 2, password: hashedPassword, role: Role.Common };

    (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (mockHashService.hash as jest.Mock).mockResolvedValue(hashedPassword);
    (mockUserRepository.create as jest.Mock).mockResolvedValue(createdUser);
    
    await useCase.execute(input as CreateUserInput);
    
    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: Role.Common,
      }),
    );
  });
  it('should throw an error if email is already in use', async () => {
    const input: CreateUserInput = {
      name: 'Test User',
      email: 'existing@example.com',
      password: 'StrongP@ss1',
      role: Role.Common,
      userCategory: UserCategory.Fisica,
      city: 'City',
      state: 'ST',
    };

    (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      email: input.email,
    });

    await expect(useCase.execute(input)).rejects.toThrow(
      'Email já está em uso.',
    );

    expect(mockHashService.hash).not.toHaveBeenCalled();
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });
});

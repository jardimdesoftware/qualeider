import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@/application/services/users/users.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { createUser } from '../../../factories';
import { createMockPrismaService } from '../../../mocks';
import { UserCategory, Status } from '@/domain/enums/enums';

// Mock bcrypt
jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const createDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'plainPassword123',
        userCategory: UserCategory.Fisica,
        city: 'São Paulo',
        state: 'SP',
      };

      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockCreatedUser = createUser({
        id: 1,
        ...createDto,
        password: hashedPassword,
      });

      prismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword123', 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
          userCategory: UserCategory.Fisica,
          city: 'São Paulo',
          state: 'SP',
        },
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('john@example.com');
    });

    it('should throw ConflictException when email already exists', async () => {
      const createDto: CreateUserDto = {
        name: 'Jane Doe',
        email: 'existing@example.com',
        password: 'password123',
        userCategory: UserCategory.Fisica,
        city: 'Rio de Janeiro',
        state: 'RJ',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should remove password from returned user object', async () => {
      const createDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        userCategory: UserCategory.Juridica,
        city: 'Brasília',
        state: 'DF',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const mockUser = createUser({ ...createDto, password: 'hashedPassword' });
      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findAll', () => {
    it('should return all active users', async () => {
      const mockUsers = [
        createUser({ id: 1, status: Status.Active }),
        createUser({ id: 2, status: Status.Active }),
      ];

      prismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { status: 'Active' },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
        }),
      });
      expect(result).toHaveLength(2);
    });

    it('should filter users by associationId when provided', async () => {
      const mockUsers = [createUser({ id: 1, associationId: 10 })];

      prismaService.user.findMany.mockResolvedValue(mockUsers);

      await service.findAll(10);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { status: 'Active', associationId: 10 },
        select: expect.any(Object),
      });
    });

    it('should not include password in select fields', async () => {
      prismaService.user.findMany.mockResolvedValue([]);

      await service.findAll();

      const selectFields = (prismaService.user.findMany.mock.calls[0][0] as any).select;
      expect(selectFields).not.toHaveProperty('password');
    });

    it('should include association data in select', async () => {
      prismaService.user.findMany.mockResolvedValue([]);

      await service.findAll();

      const selectFields = (prismaService.user.findMany.mock.calls[0][0] as any).select;
      expect(selectFields.association).toBeDefined();
      expect(selectFields.association.select).toHaveProperty('name');
    });
  });

  describe('findOne', () => {
    it('should return a single active user by id', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1, status: 'Active' },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
          animals: expect.any(Object),
        }),
      });
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is inactive', async () => {
      const inactiveUser = createUser({ id: 1, status: Status.Inactive });

      prismaService.user.findUnique.mockResolvedValue(null); // Prisma won't return inactive user

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('should include animals in the response', async () => {
      const mockUser = {
        ...createUser({ id: 1 }),
        animals: [
          { id: 1, name: 'Estrela', breed: 'Holandesa', age: 5, createdAt: new Date() },
        ],
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result.animals).toBeDefined();
      expect(result.animals).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        city: 'Updated City',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1, status: 'Active' },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should hash password when updating', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = {
        password: 'newPassword123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        password: 'newHashedPassword',
      });

      await service.update(1, updateDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          password: 'newHashedPassword',
        }),
      });
    });

    it('should not hash empty password', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        password: '',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);

      await service.update(1, updateDto);

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      const updateDto: UpdateUserDto = { name: 'New Name' };

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should remove password from returned user', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active, password: 'hashedPass' });

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.update(1, { name: 'Updated' });

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('partialUpdate', () => {
    it('should partially update user', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdatePartialUserDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
        userCategory: UserCategory.Fisica,
        state: 'SP',
        city: 'New City',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        city: 'New City',
      });

      const result = await service.partialUpdate(1, updateDto);

      expect(result.city).toBe('New City');
      expect(result).not.toHaveProperty('password');
    });

    it('should hash password in partial update', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdatePartialUserDto = {
        name: 'User Name',
        email: 'user@example.com',
        userCategory: UserCategory.Fisica,
        state: 'RJ',
        city: 'Rio de Janeiro',
        password: 'partialNewPassword',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('partialHashedPassword');

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);

      await service.partialUpdate(1, updateDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('partialNewPassword', 10);
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.partialUpdate(999, {
          name: 'Name',
          email: 'email@test.com',
          userCategory: UserCategory.Fisica,
          state: 'TS',
          city: 'City',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete user by setting status to Inactive', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        status: Status.Inactive,
      });

      const result = await service.remove(1);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'Inactive' },
      });
      expect(result.status).toBe(Status.Inactive);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user already inactive', async () => {
      prismaService.user.findUnique.mockResolvedValue(null); // Active user not found

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = createUser({ email: 'test@example.com' });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when email not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should return user even if inactive', async () => {
      const inactiveUser = createUser({
        email: 'inactive@example.com',
        status: Status.Inactive,
      });

      prismaService.user.findUnique.mockResolvedValue(inactiveUser);

      const result = await service.findByEmail('inactive@example.com');

      expect(result).toBeDefined();
      expect(result?.status).toBe(Status.Inactive);
    });
  });

  describe('password handling', () => {
    it('should always remove password from response in create', async () => {
      const createDto: CreateUserDto = {
        name: 'Test',
        email: 'test@test.com',
        password: 'pass123',
        userCategory: UserCategory.Fisica,
        city: 'City',
        state: 'ST',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prismaService.user.create.mockResolvedValue(
        createUser({ ...createDto, password: 'hashed' }),
      );

      const result = await service.create(createDto);

      expect(result).not.toHaveProperty('password');
    });

    it('should use bcrypt with 10 salt rounds for password hashing', async () => {
      const createDto: CreateUserDto = {
        name: 'Test',
        email: 'test@test.com',
        password: 'myPassword',
        userCategory: UserCategory.Fisica,
        city: 'City',
        state: 'ST',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prismaService.user.create.mockResolvedValue(createUser(createDto));

      await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('myPassword', 10);
    });
  });
});

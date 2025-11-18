import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@/application/services/users/users.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { createUser } from '../../../factories/user.factory';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { UserCategory, Status } from '@/domain/enums/enums';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

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

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'plainPassword123',
        BCRYPT_ROUNDS_USER_CREATION,
      );
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          password: hashedPassword,
        },
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('john@example.com');
    });

    it('should throw BusinessException when email already exists', async () => {
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
        { code: 'P2002', clientVersion: '5.0.0' } as any,
      );
      prismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Email já está em uso.',
      );
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
        select: expect.any(Object),
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
  });

  describe('findOne', () => {
    it('should return a single active user by id', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1, status: 'Active' },
        select: expect.any(Object),
      });
      expect(result.id).toBe(1);
    });

    it('should throw EntityNotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('should throw EntityNotFoundException when user is inactive', async () => {
      // findUnique where status='Active' returns null for inactive users
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(EntityNotFoundException);
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

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should hash password when updating', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = { password: 'newPassword123' };

      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        password: 'newHashedPassword',
      });

      await service.update(1, updateDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'newPassword123',
        BCRYPT_ROUNDS_USER_CREATION,
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ password: 'newHashedPassword' }),
      });
    });

    it('should not hash empty password', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = { name: 'Updated', password: '' };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);

      await service.update(1, updateDto);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      // Verify password is removed from update payload
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.not.objectContaining({ password: '' }),
      });
    });

    it('should throw EntityNotFoundException when user not found', async () => {
      const updateDto: UpdateUserDto = { name: 'New Name' };
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('should throw BusinessException when email already exists', async () => {
      const updateDto: UpdateUserDto = { email: 'taken@test.com' };
      const mockUser = createUser({ id: 1 });

      // First findUnique (validateUser)
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      // Second findUnique (email check) -> returns DIFFERENT user
      prismaService.user.findUnique.mockResolvedValueOnce(
        createUser({ id: 2, email: 'taken@test.com' }),
      );

      await expect(service.update(1, updateDto)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('partialUpdate', () => {
    it('should partially update user', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto = { city: 'New City' } as UpdatePartialUserDto;

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        city: 'New City',
      });

      const result = await service.partialUpdate(1, updateDto);
      expect(result.city).toBe('New City');
    });

      it('should throw EntityNotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.partialUpdate(999, {
          name: 'Name',
          email: 'name@example.com',
          userCategory: UserCategory.Fisica,
          state: 'SP',
          city: 'City',
        }),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
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
    });

    it('should throw EntityNotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when email not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@/application/services/users/users.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { IHashService as IHashServiceSymbol, type IHashService } from '@/application/ports/hash.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { createUser } from '../../../factories/user.factory';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { UserCategory, Status } from '@/domain/enums/enums';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';



describe('UsersService', () => {
  let service: UsersService;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let hashService: IHashService;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: IHashServiceSymbol,
          useValue: {
            hash: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    hashService = module.get<IHashService>(IHashServiceSymbol) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um novo usuário com senha criptografada', async () => {
      const createDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'plainPassword123',
        userCategory: UserCategory.Fisica,
        city: 'São Paulo',
        state: 'SP',
      };
      const hashedPassword = 'hashedPassword123';
      (hashService.hash as jest.Mock).mockResolvedValue(hashedPassword);
      const mockCreatedUser = createUser({
        id: 1,
        ...createDto,
        password: hashedPassword,
      });
      prismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.create(createDto);

      expect(hashService.hash).toHaveBeenCalledWith(
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

    it('deve lançar BusinessException quando email já está em uso', async () => {
      const createDto: CreateUserDto = {
        name: 'Jane Doe',
        email: 'existing@example.com',
        password: 'password123',
        userCategory: UserCategory.Fisica,
        city: 'Rio de Janeiro',
        state: 'RJ',
      };

      (hashService.hash as jest.Mock).mockResolvedValue('hashedPassword');

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
    it('deve relançar erros desconhecidos do Prisma', async () => {
      const createDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        userCategory: UserCategory.Fisica,
        city: 'São Paulo',
        state: 'SP',
      };

      (hashService.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unknown database error',
        { code: 'P2000', clientVersion: '5.0.0' } as any,
      );
      prismaService.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });

    it('deve relançar erros genéricos (não-Prisma)', async () => {
      const createDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        userCategory: UserCategory.Fisica,
        city: 'São Paulo',
        state: 'SP',
      };

      (hashService.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const genericError = new Error('Network failure');
      prismaService.user.create.mockRejectedValue(genericError);

      await expect(service.create(createDto)).rejects.toThrow(
        'Network failure',
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os usuários ativos', async () => {
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

    it('deve filtrar usuários por associationId quando informado', async () => {
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
    it('deve retornar um único usuário ativo por id', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1, status: 'Active' },
        select: expect.any(Object),
      });
      expect(result.id).toBe(1);
    });

    it('deve lançar EntityNotFoundException quando usuário não for encontrado', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('deve lançar EntityNotFoundException quando usuário estiver inativo', async () => {
      // findUnique where status='Active' returns null for inactive users
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar usuário com sucesso', async () => {
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

    it('deve hashear a senha ao atualizar', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = { password: 'newPassword123' };

      (hashService.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        password: 'newHashedPassword',
      });

      await service.update(1, updateDto);

      expect(hashService.hash).toHaveBeenCalledWith(
        'newPassword123',
        BCRYPT_ROUNDS_USER_CREATION,
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ password: 'newHashedPassword' }),
      });
    });

    it('não deve hashear senha vazia', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = { name: 'Updated', password: '' };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);

      await service.update(1, updateDto);

      expect(hashService.hash).not.toHaveBeenCalled();
      // Verify password is removed from update payload
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.not.objectContaining({ password: '' }),
      });
    });

    it('deve lançar EntityNotFoundException quando usuário não for encontrado', async () => {
      const updateDto: UpdateUserDto = { name: 'New Name' };
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('deve lançar BusinessException quando email já existe', async () => {
      const updateDto: UpdateUserDto = { email: 'taken@test.com' };
      const mockUser = createUser({ id: 1 });

      prismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      prismaService.user.findUnique.mockResolvedValueOnce(
        createUser({ id: 2, email: 'taken@test.com' }),
      );

      await expect(service.update(1, updateDto)).rejects.toThrow(
        BusinessException,
      );
    });

    it('deve tratar erro P2002 durante atualização e lançar BusinessException', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        city: 'Updated City',
      };
      const mockUser = createUser({ id: 1, status: Status.Active });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' } as any,
      );
      prismaService.user.update.mockRejectedValue(prismaError);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Email já cadastrado',
      );
    });

    it('deve relançar erros Prisma não-P2002 durante atualização', async () => {
      const updateDto: UpdateUserDto = { name: 'Updated Name' };
      const mockUser = createUser({ id: 1, status: Status.Active });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.0.0' } as any,
      );
      prismaService.user.update.mockRejectedValue(prismaError);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });

    it('deve relançar erros genéricos durante atualização', async () => {
      const updateDto: UpdateUserDto = { name: 'Updated Name' };
      const mockUser = createUser({ id: 1, status: Status.Active });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const genericError = new Error('Database connection lost');
      prismaService.user.update.mockRejectedValue(genericError);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Database connection lost',
      );
    });
  });

  describe('partialUpdate', () => {
    it('deve atualizar parcialmente o usuário', async () => {
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

    it('deve tratar erro P2002 durante atualização parcial e lançar BusinessException', async () => {
      const updateDto = { city: 'New City' } as UpdatePartialUserDto;
      const mockUser = createUser({ id: 1, status: Status.Active });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' } as any,
      );
      prismaService.user.update.mockRejectedValue(prismaError);

      await expect(service.partialUpdate(1, updateDto)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('remove', () => {
    it('deve desativar o usuário (soft delete)', async () => {
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

    it('deve lançar EntityNotFoundException quando usuário não for encontrado', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('deve retornar usuário por email', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');
      expect(result?.email).toBe('test@example.com');
    });

    it('deve retornar null quando email não for encontrado', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });
});

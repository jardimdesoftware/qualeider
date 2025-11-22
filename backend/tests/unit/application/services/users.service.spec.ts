import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@/application/services/users/users.service';
import { IUserRepository as IUserRepositorySymbol, type IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService as IHashServiceSymbol, type IHashService } from '@/application/ports/hash.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { createUser } from '../../../factories/user.factory';
import { UserCategory, Status } from '@/domain/enums/enums';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { Prisma } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: IUserRepository;
  let hashService: IHashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: IUserRepositorySymbol,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            partialUpdate: jest.fn(),
            softDelete: jest.fn(),
            findByEmail: jest.fn(),
          },
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
    userRepository = module.get<IUserRepository>(IUserRepositorySymbol) as any;
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
      (userRepository.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await service.create(createDto);

      expect(hashService.hash).toHaveBeenCalledWith(
        'plainPassword123',
        BCRYPT_ROUNDS_USER_CREATION,
      );
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createDto,
        password: hashedPassword,
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

      // Repository agora lança BusinessException diretamente (trata Prisma internamente)
      const error = new BusinessException('Email já está em uso.');
      (userRepository.create as jest.Mock).mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Email já está em uso.',
      );
    });
    it('deve relançar erros não tratados do Repository', async () => {
      const createDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        userCategory: UserCategory.Fisica,
        city: 'São Paulo',
        state: 'SP',
      };

      (hashService.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Repository pode lançar qualquer erro inesperado
      const error = new Error('Unexpected database error');
      (userRepository.create as jest.Mock).mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toThrow('Unexpected database error');
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
      (userRepository.create as jest.Mock).mockRejectedValue(genericError);

      await expect(service.create(createDto)).rejects.toThrow(
        'Network failure',
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os usuários', async () => {
      const mockUsers = [
        createUser({ id: 1, status: Status.Active }),
        createUser({ id: 2, status: Status.Active }),
      ];

      (userRepository.findAll as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(userRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('deve filtrar usuários por associationId quando informado', async () => {
      const mockUsers = [createUser({ id: 1, associationId: 10 })];
      (userRepository.findAll as jest.Mock).mockResolvedValue(mockUsers);

      await service.findAll({ associationId: 10 });

      expect(userRepository.findAll).toHaveBeenCalledWith({ associationId: 10 });
    });
  });

  describe('findOne', () => {
    it('deve retornar um único usuário ativo por id', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    it('deve lançar EntityNotFoundException quando usuário não for encontrado', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('deve lançar EntityNotFoundException quando usuário estiver inativo', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

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

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(userRepository.partialUpdate).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('Updated Name');
    });

    it('deve hashear a senha ao atualizar', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = { password: 'newPassword123' };

      (hashService.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'newHashedPassword',
      });

      await service.update(1, updateDto);

      expect(hashService.hash).toHaveBeenCalledWith(
        'newPassword123',
        BCRYPT_ROUNDS_USER_CREATION,
      );
      expect(userRepository.partialUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ password: 'newHashedPassword' }),
      );
    });

    it('não deve hashear senha vazia', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = { name: 'Updated', password: '' };

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.partialUpdate as jest.Mock).mockResolvedValue(mockUser);

      await service.update(1, updateDto);

      expect(hashService.hash).not.toHaveBeenCalled();
      expect(userRepository.partialUpdate).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({ password: '' }),
      );
    });

    it('deve lançar EntityNotFoundException quando usuário não for encontrado', async () => {
      const updateDto: UpdateUserDto = { name: 'New Name' };
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        EntityNotFoundException,
      );
    });



    it('deve tratar erro P2002 durante atualização e lançar BusinessException', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        city: 'Updated City',
      };
      const mockUser = createUser({ id: 1, status: Status.Active });

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      // Repository lança BusinessException diretamente
      const error = new BusinessException('Email já cadastrado');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Email já cadastrado',
      );
    });

    it('deve relançar erros de foreign key do Repository durante atualização', async () => {
      const updateDto: UpdateUserDto = { name: 'Updated Name' };
      const mockUser = createUser({ id: 1, status: Status.Active });

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      // Repository trata P2003 e lança BusinessException
      const error = new BusinessException('Referência inválida. Verifique os dados relacionados.');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.update(1, updateDto)).rejects.toThrow(BusinessException);
    });

    it('deve relançar erros genéricos durante atualização', async () => {
      const updateDto: UpdateUserDto = { name: 'Updated Name' };
      const mockUser = createUser({ id: 1, status: Status.Active });

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const genericError = new Error('Database connection lost');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(genericError);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Database connection lost',
      );
    });
  });

  describe('partialUpdate', () => {
    it('deve atualizar parcialmente o usuário', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto = { city: 'New City' } as UpdatePartialUserDto;

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        city: 'New City',
      });

      const result = await service.partialUpdate(1, updateDto);
      expect(result.city).toBe('New City');
    });

    it('deve tratar erro de email duplicado durante atualização parcial e lançar BusinessException', async () => {
      const updateDto = { city: 'New City' } as UpdatePartialUserDto;
      const mockUser = createUser({ id: 1, status: Status.Active });

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      // Repository lança BusinessException diretamente
      const error = new BusinessException('Email já cadastrado');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.partialUpdate(1, updateDto)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('remove', () => {
    it('deve desativar o usuário (soft delete)', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.softDelete as jest.Mock).mockResolvedValue(undefined);
      (userRepository.findById as jest.Mock).mockResolvedValueOnce(mockUser).mockResolvedValueOnce({ ...mockUser, status: Status.Inactive });

      const result = await service.remove(1);

      expect(userRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result.status).toBe(Status.Inactive);
    });

    it('deve lançar EntityNotFoundException quando usuário não for encontrado', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('deve retornar usuário por email', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');
      expect(result?.email).toBe('test@example.com');
    });

    it('deve retornar null quando email não for encontrado', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });
});

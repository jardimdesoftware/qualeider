import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@/application/services/users/users.service';
import { IUserRepository as IUserRepositorySymbol, type IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService as IHashServiceSymbol, type IHashService } from '@/application/ports/hash.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { createUser } from '../../../factories/user.factory';
import { UserCategory, UserRole, Status } from '@/domain/enums/enums';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { ForbiddenException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: IUserRepository;
  let hashService: IHashService;

  const admin = { id: 1, role: UserRole.ADMIN };
  const vaqueiro = { id: 1, role: UserRole.VAQUEIRO };

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
        role: UserRole.ADMIN, // fallback injetado pelo service quando role não é informado
        password: hashedPassword,
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('john@example.com');
      expect(result.email).toBe('john@example.com');
    });

    it('deve retornar o usuário sem alteração se ele não tiver propriedade password (branch coverage)', async () => {
      const createDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'plain',
        userCategory: UserCategory.Fisica,
        city: 'SP',
        state: 'SP',
      };

      (hashService.hash as jest.Mock).mockResolvedValue('hash');

      // Simula retorno do repositório já sem senha (por algum motivo, ex: projeção)
      const mockUserNoPass = { id: 1, name: 'John', email: 'john@example.com' };
      (userRepository.create as jest.Mock).mockResolvedValue(mockUserNoPass);

      const result = await service.create(createDto);

      expect(result).toEqual(mockUserNoPass);
      // Verifica se passou pelo fluxo do removePassword que retorna a entidade direto
      expect(result).not.toHaveProperty('password');
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

  describe('findAll (só ADMIN pode listar; sistema single-tenant, sem isolamento entre admins)', () => {
    const mockPaginatedResult = (users: ReturnType<typeof createUser>[]) => ({
      data: users,
      total: users.length,
      page: 1,
      limit: 50,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    it('deve negar listagem quando o requisitante não é ADMIN', async () => {
      await expect(service.findAll({}, vaqueiro)).rejects.toThrow(ForbiddenException);

      expect(userRepository.findAll).not.toHaveBeenCalled();
    });

    it('deve listar usando os critérios repassados, sem forçar nenhum escopo', async () => {
      const mockUsers = [createUser({ id: 2 }), createUser({ id: 3 })];
      (userRepository.findAll as jest.Mock).mockResolvedValue(mockPaginatedResult(mockUsers));

      const result = await service.findAll({ status: 'Active' }, admin);

      expect(userRepository.findAll).toHaveBeenCalledWith({ status: 'Active' });
      expect(result.data).toHaveLength(2);
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

  describe('findOneForRequester (só ADMIN pode buscar por ID via API)', () => {
    it('deve negar quando o requisitante não é ADMIN', async () => {
      await expect(service.findOneForRequester(2, vaqueiro)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve permitir quando o requisitante é ADMIN, mesmo para um usuário sem nenhuma relação com ele', async () => {
      const targetUser = createUser({ id: 2, status: Status.Active });
      (userRepository.findById as jest.Mock).mockResolvedValue(targetUser);

      const result = await service.findOneForRequester(2, admin);

      expect(result.id).toBe(2);
    });
  });

  describe('update', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        city: 'Updated City',
      };

      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.update(1, updateDto, admin);

      expect(userRepository.partialUpdate).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('Updated Name');
    });

    it('deve hashear a senha ao atualizar', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = { password: 'newPassword123' };

      (hashService.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'newHashedPassword',
      });

      await service.update(1, updateDto, admin);

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

      (userRepository.partialUpdate as jest.Mock).mockResolvedValue(mockUser);

      await service.update(1, updateDto, admin);

      expect(hashService.hash).not.toHaveBeenCalled();
      expect(userRepository.partialUpdate).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({ password: '' }),
      );
    });

    it('deve lançar EntityNotFoundException quando usuário não for encontrado', async () => {
      const updateDto: UpdateUserDto = { name: 'New Name' };
      const error = new EntityNotFoundException('Usuário não encontrado');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.update(999, updateDto, admin)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('deve propagar o status ao inativar um funcionário (regressão #167)', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto: UpdateUserDto = { status: Status.Inactive };

      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        status: Status.Inactive,
      });

      const result = await service.update(1, updateDto, admin);

      expect(userRepository.partialUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: Status.Inactive }),
      );
      expect(result.status).toBe(Status.Inactive);
    });

    it('deve propagar o status ao reativar um funcionário inativo (regressão #167)', async () => {
      const mockUser = createUser({ id: 1, status: Status.Inactive });
      const updateDto: UpdateUserDto = { status: Status.Active };

      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        status: Status.Active,
      });

      const result = await service.update(1, updateDto, admin);

      expect(userRepository.partialUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: Status.Active }),
      );
      expect(result.status).toBe(Status.Active);
    });

    it('deve tratar erro P2002 durante atualização e lançar BusinessException', async () => {
      const updateDto: UpdateUserDto = {
        name: 'Updated Name',
        city: 'Updated City',
      };

      // Repository lança BusinessException diretamente
      const error = new BusinessException('Email já cadastrado');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.update(1, updateDto, admin)).rejects.toThrow(
        BusinessException,
      );
      await expect(service.update(1, updateDto, admin)).rejects.toThrow(
        'Email já cadastrado',
      );
    });

    it('deve relançar erros de foreign key do Repository durante atualização', async () => {
      const updateDto: UpdateUserDto = { name: 'Updated Name' };

      // Repository trata P2003 e lança BusinessException
      const error = new BusinessException('Referência inválida. Verifique os dados relacionados.');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.update(1, updateDto, admin)).rejects.toThrow(BusinessException);
    });

    it('deve relançar erros genéricos durante atualização', async () => {
      const updateDto: UpdateUserDto = { name: 'Updated Name' };

      const genericError = new Error('Database connection lost');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(genericError);

      await expect(service.update(1, updateDto, admin)).rejects.toThrow(
        'Database connection lost',
      );
    });
  });

  describe('autorização de gerenciamento (correção da escalada de privilégio)', () => {
    it('deve negar edição quando o requisitante não é ADMIN', async () => {
      const updateDto: UpdateUserDto = { role: UserRole.ADMIN } as UpdateUserDto;

      await expect(service.update(2, updateDto, vaqueiro)).rejects.toThrow(
        ForbiddenException,
      );

      expect(userRepository.partialUpdate).not.toHaveBeenCalled();
    });

    it('deve permitir que o ADMIN edite qualquer usuário do sistema (single-tenant, sem isolamento entre admins)', async () => {
      const updateDto: UpdateUserDto = { name: 'Novo Nome' };
      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        id: 2,
        name: 'Novo Nome',
      });

      const result = await service.update(2, updateDto, admin);

      expect(userRepository.partialUpdate).toHaveBeenCalledWith(2, updateDto);
      expect(result.name).toBe('Novo Nome');
    });
  });

  describe('partialUpdate', () => {
    it('deve atualizar parcialmente o usuário', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const updateDto = { city: 'New City' } as UpdatePartialUserDto;

      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        city: 'New City',
      });

      const result = await service.partialUpdate(1, updateDto, admin);
      expect(result.city).toBe('New City');
    });

    it('deve negar quando o requisitante não é ADMIN', async () => {
      const updateDto = { city: 'New City' } as UpdatePartialUserDto;

      await expect(service.partialUpdate(1, updateDto, vaqueiro)).rejects.toThrow(
        ForbiddenException,
      );
      expect(userRepository.partialUpdate).not.toHaveBeenCalled();
    });

    it('deve tratar erro de email duplicado durante atualização parcial e lançar BusinessException', async () => {
      const updateDto = { city: 'New City' } as UpdatePartialUserDto;

      // Repository lança BusinessException diretamente
      const error = new BusinessException('Email já cadastrado');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.partialUpdate(1, updateDto, admin)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('remove', () => {
    it('deve desativar o usuário (soft delete)', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      const mockDeactivatedUser = { ...mockUser, status: Status.Inactive };

      (userRepository.softDelete as jest.Mock).mockResolvedValue(mockDeactivatedUser);

      const result = await service.remove(1, admin);

      expect(userRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result.status).toBe(Status.Inactive);
    });

    it('deve lançar EntityNotFoundException quando usuário não for encontrado', async () => {
      const error = new EntityNotFoundException('Usuário não encontrado');
      (userRepository.softDelete as jest.Mock).mockRejectedValue(error);

      await expect(service.remove(999, admin)).rejects.toThrow(EntityNotFoundException);
    });

    it('deve negar remoção quando o requisitante não é ADMIN', async () => {
      await expect(service.remove(2, vaqueiro)).rejects.toThrow(ForbiddenException);

      expect(userRepository.softDelete).not.toHaveBeenCalled();
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
  describe('exists', () => {
    it('deve retornar true se o usuário existir', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue({ id: 1 });
      const result = await service.exists(1);
      expect(result).toBe(true);
    });

    it('deve retornar false se o usuário não existir', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);
      const result = await service.exists(999);
      expect(result).toBe(false);
    });
  });
});

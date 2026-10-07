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
  const adminRequester = { id: 1, role: UserRole.ADMIN, associationId: null };
  const vaqueiroRequester = { id: 2, role: UserRole.VAQUEIRO, associationId: null };

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
            findByIdAny: jest.fn(),
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

  describe('findAll', () => {
    it('deve retornar todos os usuários', async () => {
      const mockUsers = [
        createUser({ id: 1, status: Status.Active }),
        createUser({ id: 2, status: Status.Active }),
      ];
      const mockPaginatedResult = {
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      (userRepository.findAll as jest.Mock).mockResolvedValue(mockPaginatedResult);

      const result = await service.findAll({}, adminRequester);

      expect(userRepository.findAll).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('deve filtrar usuários por associationId quando informado', async () => {
      const mockUsers = [createUser({ id: 1, associationId: 10 })];
      const mockPaginatedResult = {
        data: mockUsers,
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      (userRepository.findAll as jest.Mock).mockResolvedValue(mockPaginatedResult);

      await service.findAll({ associationId: 10 }, adminRequester);

      expect(userRepository.findAll).toHaveBeenCalledWith({
        associationId: 10,
        scope: { adminGroupId: adminRequester.id },
      });
    });

    it('lista só o escopo do requisitante: admin de associação vê a associação, sem associação vê o próprio grupo', async () => {
      (userRepository.findAll as jest.Mock).mockResolvedValue({ data: [], total: 0, page: 1, limit: 50, totalPages: 0, hasNextPage: false, hasPreviousPage: false });

      await service.findAll({}, { id: 1, role: UserRole.ADMIN, associationId: 9 });
      expect(userRepository.findAll).toHaveBeenLastCalledWith({ scope: { associationId: 9 } });

      await service.findAll({}, { id: 1, role: UserRole.ADMIN, associationId: null });
      expect(userRepository.findAll).toHaveBeenLastCalledWith({ scope: { adminGroupId: 1 } });
    });

    it('deve negar listagem quando o requisitante nao e ADMIN', async () => {
      await expect(service.findAll({}, vaqueiroRequester)).rejects.toThrow(
        ForbiddenException,
      );

      expect(userRepository.findAll).not.toHaveBeenCalled();
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
    it('deve negar busca por ID quando o requisitante nao e ADMIN', async () => {
      await expect(
        service.findOneForRequester(1, vaqueiroRequester),
      ).rejects.toThrow(ForbiddenException);

      expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('deve permitir busca por ID quando o requisitante e ADMIN', async () => {
      const mockUser = createUser({ id: 1, status: Status.Active });
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOneForRequester(1, adminRequester);

      expect(userRepository.findByIdAny).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    it('deve permitir que ADMIN busque um funcionario inativo (para poder reativa-lo)', async () => {
      const mockUser = createUser({ id: 2, status: Status.Inactive, role: UserRole.VAQUEIRO, adminId: adminRequester.id });
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOneForRequester(2, adminRequester);

      expect(result.id).toBe(2);
      expect(result.status).toBe(Status.Inactive);
    });

    it('admin NÃO lê usuário de outro dono (403)', async () => {
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(
        createUser({ id: 9, role: UserRole.ADMIN, adminId: null, associationId: null }),
      );

      await expect(service.findOneForRequester(9, adminRequester)).rejects.toThrow(ForbiddenException);
    });

    it('admin lê a si mesmo e membros da própria associação', async () => {
      (userRepository.findByIdAny as jest.Mock).mockResolvedValueOnce(createUser({ id: adminRequester.id }));
      await expect(service.findOneForRequester(adminRequester.id, adminRequester)).resolves.toBeDefined();

      (userRepository.findByIdAny as jest.Mock).mockResolvedValueOnce(createUser({ id: 8, associationId: 4, adminId: null }));
      await expect(
        service.findOneForRequester(8, { id: 1, role: UserRole.ADMIN, associationId: 4 }),
      ).resolves.toBeDefined();
    });
  });

  describe('vínculo com associação na edição', () => {
    const target = () => createUser({ id: 8, adminId: 1, associationId: null, status: Status.Active });
    const admin = { id: 1, role: UserRole.ADMIN, associationId: 5 };

    it.each([
      ['update', (dto: any, req: any) => service.update(8, dto, req)],
      ['partialUpdate', (dto: any, req: any) => service.partialUpdate(8, dto, req)],
    ])('%s: admin não vincula usuário a associação alheia', async (_name, call) => {
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(target());

      await expect(call({ associationId: 99 }, admin)).rejects.toThrow(ForbiddenException);
      expect(userRepository.partialUpdate).not.toHaveBeenCalled();
    });

    it.each([
      ['update', (dto: any, req: any) => service.update(8, dto, req)],
      ['partialUpdate', (dto: any, req: any) => service.partialUpdate(8, dto, req)],
    ])('%s: admin sem associação também não vincula a nenhuma', async (_name, call) => {
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(target());

      await expect(call({ associationId: 5 }, { ...admin, associationId: null })).rejects.toThrow(ForbiddenException);
    });

    it('permite vincular à própria associação do admin', async () => {
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(target());
      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({ ...target(), associationId: 5 });

      await service.partialUpdate(8, { associationId: 5 } as any, admin);

      expect(userRepository.partialUpdate).toHaveBeenCalledWith(8, expect.objectContaining({ associationId: 5 }));
    });

    it('edições sem associationId seguem normais', async () => {
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(target());
      (userRepository.partialUpdate as jest.Mock).mockResolvedValue(target());

      await service.partialUpdate(8, { name: 'Novo Nome' } as any, admin);

      expect(userRepository.partialUpdate).toHaveBeenCalled();
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

      const result = await service.update(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null });

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

      await service.update(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null });

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

      await service.update(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null });

      expect(hashService.hash).not.toHaveBeenCalled();
      expect(userRepository.partialUpdate).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({ password: '' }),
      );
    });

    it('deve lançar EntityNotFoundException quando usuário não for encontrado', async () => {
      const updateDto: UpdateUserDto = { name: 'New Name' };
      // O Service não chama mais findById, ele confia que p repository lança erro se não achar
      const error = new EntityNotFoundException('Usuário não encontrado');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.update(999, updateDto, { id: 999, role: UserRole.ADMIN, associationId: null })).rejects.toThrow(
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

      const result = await service.update(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null });

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

      const result = await service.update(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null });

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
      const mockUser = createUser({ id: 1, status: Status.Active });

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      // Repository lança BusinessException diretamente
      const error = new BusinessException('Email já cadastrado');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.update(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null })).rejects.toThrow(
        BusinessException,
      );
      await expect(service.update(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null })).rejects.toThrow(
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

      await expect(service.update(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null })).rejects.toThrow(BusinessException);
    });

    it('deve relançar erros genéricos durante atualização', async () => {
      const updateDto: UpdateUserDto = { name: 'Updated Name' };
      const mockUser = createUser({ id: 1, status: Status.Active });

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const genericError = new Error('Database connection lost');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(genericError);

      await expect(service.update(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null })).rejects.toThrow(
        'Database connection lost',
      );
    });
  });

  describe('autorização de gerenciamento (correção da escalada de privilégio)', () => {
    it('deve negar edição quando o requisitante não é ADMIN', async () => {
      const updateDto: UpdateUserDto = { role: UserRole.ADMIN } as UpdateUserDto;

      await expect(
        service.update(2, updateDto, { id: 1, role: UserRole.VAQUEIRO, associationId: null }),
      ).rejects.toThrow(ForbiddenException);

      expect(userRepository.partialUpdate).not.toHaveBeenCalled();
    });

    it('deve negar edição quando o ADMIN não gerencia o usuário alvo (fora da sua associação/equipe)', async () => {
      const targetUser = createUser({ id: 2, associationId: 99, adminId: null });
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(targetUser);
      const updateDto: UpdateUserDto = { name: 'Novo Nome' };

      await expect(
        service.update(2, updateDto, { id: 1, role: UserRole.ADMIN, associationId: 10 }),
      ).rejects.toThrow(ForbiddenException);

      expect(userRepository.partialUpdate).not.toHaveBeenCalled();
    });

    it('deve permitir que o ADMIN edite um funcionário vinculado a ele via adminId', async () => {
      const targetUser = createUser({ id: 2, associationId: null, adminId: 1 });
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(targetUser);
      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        ...targetUser,
        name: 'Novo Nome',
      });
      const updateDto: UpdateUserDto = { name: 'Novo Nome' };

      const result = await service.update(2, updateDto, {
        id: 1,
        role: UserRole.ADMIN,
        associationId: null,
      });

      expect(userRepository.partialUpdate).toHaveBeenCalledWith(2, updateDto);
      expect(result.name).toBe('Novo Nome');
    });

    it('deve permitir que o ADMIN edite um usuário da mesma associação', async () => {
      const targetUser = createUser({ id: 2, associationId: 10, adminId: null });
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(targetUser);
      (userRepository.partialUpdate as jest.Mock).mockResolvedValue({
        ...targetUser,
        role: UserRole.ADMIN,
      });
      const updateDto: UpdateUserDto = { role: UserRole.ADMIN } as UpdateUserDto;

      await service.update(2, updateDto, { id: 1, role: UserRole.ADMIN, associationId: 10 });

      expect(userRepository.partialUpdate).toHaveBeenCalledWith(2, updateDto);
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

      const result = await service.partialUpdate(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null });
      expect(result.city).toBe('New City');
    });

    it('deve tratar erro de email duplicado durante atualização parcial e lançar BusinessException', async () => {
      const updateDto = { city: 'New City' } as UpdatePartialUserDto;
      const mockUser = createUser({ id: 1, status: Status.Active });

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      // Repository lança BusinessException diretamente
      const error = new BusinessException('Email já cadastrado');
      (userRepository.partialUpdate as jest.Mock).mockRejectedValue(error);

      await expect(service.partialUpdate(1, updateDto, { id: 1, role: UserRole.ADMIN, associationId: null })).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('remove', () => {
    it('admin desativa um funcionário vinculado a ele (soft delete)', async () => {
      const target = createUser({ id: 5, status: Status.Active, adminId: 1 });
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(target);
      (userRepository.softDelete as jest.Mock).mockResolvedValue({ ...target, status: Status.Inactive });

      const result = await service.remove(5, adminRequester);

      expect(userRepository.softDelete).toHaveBeenCalledWith(5);
      expect(result.status).toBe(Status.Inactive);
    });

    it('admin pode desativar a própria conta (sem consultar o escopo)', async () => {
      const self = createUser({ id: 1, status: Status.Active });
      (userRepository.softDelete as jest.Mock).mockResolvedValue({ ...self, status: Status.Inactive });

      await service.remove(1, adminRequester);

      expect(userRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('admin NÃO desativa usuário de outro dono (adminId diferente)', async () => {
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(
        createUser({ id: 9, adminId: 99, associationId: null }),
      );

      await expect(service.remove(9, adminRequester)).rejects.toThrow(ForbiddenException);
      expect(userRepository.softDelete).not.toHaveBeenCalled();
    });

    it('admin NÃO desativa outro ADMIN sem vínculo', async () => {
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(
        createUser({ id: 9, role: UserRole.ADMIN, adminId: null, associationId: null }),
      );

      await expect(service.remove(9, adminRequester)).rejects.toThrow(ForbiddenException);
      expect(userRepository.softDelete).not.toHaveBeenCalled();
    });

    it('admin de uma associação desativa membro da mesma associação', async () => {
      const requester = { id: 1, role: UserRole.ADMIN, associationId: 3 };
      const member = createUser({ id: 8, associationId: 3, adminId: null });
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(member);
      (userRepository.softDelete as jest.Mock).mockResolvedValue({ ...member, status: Status.Inactive });

      await service.remove(8, requester);

      expect(userRepository.softDelete).toHaveBeenCalledWith(8);
    });

    it('retorna EntityNotFoundException quando o usuário não existe', async () => {
      (userRepository.findByIdAny as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(999, adminRequester)).rejects.toThrow(EntityNotFoundException);
    });

    it('nega remoção quando o requisitante não é ADMIN', async () => {
      await expect(service.remove(1, vaqueiroRequester)).rejects.toThrow(ForbiddenException);

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

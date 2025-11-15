import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsersController } from '@/presentation/controllers/users.controller';
import { UsersService } from '@/application/services/users/users.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { UserType } from '@/domain/enums/enums';
import { createUser } from '../../../factories/user.factory';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    partialUpdate: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um usuário com sucesso', async () => {
      const createDto: CreateUserDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Password123!',
        userType: UserType.Pecuarista,
        userCategory: undefined as any,
        state: 'PE',
        city: 'Belo Jardim',
      } as any;

      const createdUser = createUser({ ...createDto, id: 1 });
      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await controller.create(createDto);

      expect(usersService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdUser);
    });

    it('deve propagar ConflictException quando email já está cadastrado', async () => {
      const createDto: CreateUserDto = {
        name: 'João Silva',
        email: 'existing@example.com',
        password: 'Password123!',
        userCategory: undefined as any,
        state: 'PE',
        city: 'Cidade',
      } as any;

      const conflictError = new Error('Email já cadastrado.');
      mockUsersService.create.mockRejectedValue(conflictError);

      await expect(controller.create(createDto)).rejects.toThrow(
        'Email já cadastrado.',
      );
    });
  });

  describe('checkEmail', () => {
    it('deve retornar exists: true quando email existe', async () => {
      const email = 'existing@example.com';
      const user = createUser({ email });

      mockUsersService.findByEmail.mockResolvedValue(user);

      const result = await controller.checkEmail(email);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual({ exists: true });
    });

    it('deve retornar exists: false quando email não existe', async () => {
      const email = 'nonexistent@example.com';

      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await controller.checkEmail(email);

      expect(result).toEqual({ exists: false });
    });

    it('deve lançar BadRequestException quando email não é fornecido', async () => {
      await expect(controller.checkEmail('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.checkEmail('')).rejects.toThrow('Email inválido');
    });

    it('deve lançar BadRequestException quando email não é string', async () => {
      await expect(controller.checkEmail(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.checkEmail(undefined as any)).rejects.toThrow(
        'Email inválido',
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os usuários quando associationId não é fornecido', async () => {
      const users = [createUser({ id: 1 }), createUser({ id: 2 })];

      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(usersService.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(users);
      expect(result).toHaveLength(2);
    });

    it('deve filtrar usuários por associationId quando fornecido', async () => {
      const associationId = '5';
      const users = [
        createUser({ id: 1, associationId: 5 }),
        createUser({ id: 2, associationId: 5 }),
      ];

      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll(associationId);

      expect(usersService.findAll).toHaveBeenCalledWith(5);
      expect(result).toEqual(users);
    });

    it('deve lançar BadRequestException quando associationId não é número', async () => {
      await expect(controller.findAll('invalid')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.findAll('invalid')).rejects.toThrow(
        'associationId inválido',
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar um usuário pelo ID', async () => {
      const userId = '1';
      const user = createUser({ id: 1 });

      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.findOne(userId);

      expect(usersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });

    it('deve lançar BadRequestException quando ID não é número', async () => {
      await expect(controller.findOne('invalid')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.findOne('invalid')).rejects.toThrow(
        'ID inválido',
      );
    });

    it('deve propagar NotFoundException quando usuário não existe', async () => {
      const userId = '999';

      const notFoundError = new Error('Usuário não encontrado.');
      mockUsersService.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne(userId)).rejects.toThrow(
        'Usuário não encontrado.',
      );
    });
  });

  describe('update', () => {
    it('deve atualizar todos os dados do usuário', async () => {
      const userId = '1';
      const updateDto: UpdateUserDto = {
        name: 'João Silva Atualizado',
        email: 'joao.updated@example.com',
        password: 'NewPassword123!',
        userType: UserType.Pecuarista as any,
        document: '98765432100',
        state: 'PE',
        city: 'Cidade',
      } as any;

      const updatedUser = createUser({ id: 1, ...updateDto });
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, updateDto);

      expect(usersService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedUser);
    });

    it('deve lançar BadRequestException quando ID não é número', async () => {
      const updateDto: UpdateUserDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Password123!',
        state: 'PE',
        city: 'Cidade',
      } as any;

      await expect(controller.update('invalid', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.update('invalid', updateDto)).rejects.toThrow(
        'ID inválido',
      );
    });

    it('deve propagar NotFoundException quando usuário não existe', async () => {
      const userId = '999';
      const updateDto: UpdateUserDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Password123!',
        state: 'PE',
        city: 'Cidade',
      } as any;

      const notFoundError = new Error('Usuário não encontrado.');
      mockUsersService.update.mockRejectedValue(notFoundError);

      await expect(controller.update(userId, updateDto)).rejects.toThrow(
        'Usuário não encontrado.',
      );
    });
  });

  describe('partialUpdate', () => {
    it('deve atualizar apenas alguns campos do usuário', async () => {
      const userId = '1';
      const partialDto: any = {
        name: 'João Silva Atualizado',
        phoneNumber: '81999999999',
      };

      const updatedUser = createUser({
        id: 1,
        name: partialDto.name,
        phoneNumber: partialDto.phoneNumber,
      } as any);
      mockUsersService.partialUpdate.mockResolvedValue(updatedUser);

      const result = await controller.partialUpdate(userId, partialDto);

      expect(usersService.partialUpdate).toHaveBeenCalledWith(1, partialDto);
      expect(result).toEqual(updatedUser);
    });

    it('deve atualizar apenas o email', async () => {
      const userId = '1';
      const partialDto: any = {
        email: 'newemail@example.com',
      };

      const updatedUser = createUser({ id: 1, email: partialDto.email });
      mockUsersService.partialUpdate.mockResolvedValue(updatedUser);

      const result = await controller.partialUpdate(userId, partialDto);

      expect(result.email).toBe('newemail@example.com');
    });

    it('deve lançar BadRequestException quando ID não é número', async () => {
      const partialDto: any = {
        name: 'João Silva',
      };

      await expect(
        controller.partialUpdate('invalid', partialDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.partialUpdate('invalid', partialDto),
      ).rejects.toThrow('ID inválido');
    });
  });

  describe('remove', () => {
    it('deve remover um usuário com sucesso', async () => {
      const userId = '1';

      const expectedResult = { message: 'Usuário excluído com sucesso.' };
      mockUsersService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(userId);

      expect(usersService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar BadRequestException quando ID não é número', async () => {
      await expect(controller.remove('invalid')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.remove('invalid')).rejects.toThrow(
        'ID inválido',
      );
    });

    it('deve propagar NotFoundException quando usuário não existe', async () => {
      const userId = '999';

      const notFoundError = new Error('Usuário não encontrado.');
      mockUsersService.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(userId)).rejects.toThrow(
        'Usuário não encontrado.',
      );
    });
  });
});

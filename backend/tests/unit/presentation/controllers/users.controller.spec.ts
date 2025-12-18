import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UsersController } from '@/presentation/controllers/users.controller';
import { UsersService } from '@/application/services/users/users.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { createUser } from '../../../factories/user.factory';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

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
    it('deve criar um usuário com sucesso e retornar wrapper', async () => {
      const createDto: CreateUserDto = {
        name: 'João Silva',
        email: 'joao@example.com',
      } as any;

      const createdUser = createUser({ ...createDto, id: 1 });
      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await controller.create(createDto);

      expect(usersService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Usuário criado com sucesso',
        data: createdUser,
      });
    });

    it('deve propagar erro de negócio (ex: email duplicado)', async () => {
      const createDto: CreateUserDto = { email: 'existing@example.com' } as any;
      const error = new BusinessException('Email já cadastrado.');
      
      mockUsersService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(BusinessException);
    });
  });

  describe('checkEmail', () => {
    it('deve retornar exists: true quando email existe', async () => {
      const email = 'existing@example.com';
      mockUsersService.findByEmail.mockResolvedValue(createUser({ email }));

      const result = await controller.checkEmail(email);

      expect(result).toEqual({ exists: true });
    });

    it('deve retornar exists: false quando email não existe', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const result = await controller.checkEmail('new@email.com');
      expect(result).toEqual({ exists: false });
    });

    it('deve lançar BusinessException quando email não é fornecido', async () => {
      await expect(controller.checkEmail('')).rejects.toThrow(BusinessException);
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os usuários', async () => {
      const users = [createUser({ id: 1 })];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll({});

      expect(usersService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(users);
    });

    it('deve filtrar usuários por associationId, status e emailContains', async () => {
      const users = [createUser({ id: 1, associationId: 5 })];
      mockUsersService.findAll.mockResolvedValue(users);

      await controller.findAll({
        associationId: 5,
        status: 'Active',
        emailContains: 'test',
      });

      expect(usersService.findAll).toHaveBeenCalledWith({
        associationId: 5,
        status: 'Active',
        emailContains: 'test',
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um usuário pelo ID', async () => {
      const user = createUser({ id: 1 });
      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.findOne(1);

      expect(usersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });

    it('deve propagar EntityNotFoundException quando usuário não existe', async () => {
      const error = new EntityNotFoundException('Usuário não encontrado.');
      mockUsersService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(999)).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar usuário e retornar wrapper', async () => {
      const updateDto: UpdateUserDto = { name: 'João Updated' };
      const updatedUser = createUser({ id: 1, ...updateDto });
      
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, updateDto);

      expect(usersService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Usuário atualizado com sucesso',
        data: updatedUser,
      });
    });

    it('deve propagar EntityNotFoundException quando usuário não existe', async () => {
      const error = new EntityNotFoundException('Usuário não encontrado.');
      mockUsersService.update.mockRejectedValue(error);

      await expect(controller.update(999, {})).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('partialUpdate', () => {
    it('deve atualizar parcialmente e retornar wrapper', async () => {
      const updateDto: UpdatePartialUserDto = { email: 'new@email.com' } as UpdatePartialUserDto;
      const updatedUser = createUser({ id: 1, ...updateDto });
      
      mockUsersService.partialUpdate.mockResolvedValue(updatedUser);

      const result = await controller.partialUpdate(1, updateDto);

      expect(usersService.partialUpdate).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Usuário atualizado com sucesso',
        data: updatedUser,
      });
    });
  });

  describe('remove', () => {
    it('deve remover usuário e retornar wrapper', async () => {
      const deleted = createUser({ id: 1 });
      mockUsersService.remove.mockResolvedValue(deleted);

      const result = await controller.remove(1);

      expect(usersService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Usuário excluído com sucesso',
        data: deleted,
      });
    });

    it('deve propagar EntityNotFoundException', async () => {
      const error = new EntityNotFoundException('Usuário não encontrado.');
      mockUsersService.remove.mockRejectedValue(error);

      await expect(controller.remove(999)).rejects.toThrow(EntityNotFoundException);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, NotFoundException, HttpException } from '@nestjs/common';
import { AnimalsController } from '@/presentation/controllers/animals.controller';
import { AnimalsService } from '@/application/services/animals/animals.service';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { createAnimal } from '../../../factories/animal.factory';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('AnimalsController', () => {
  let controller: AnimalsController;
  let animalsService: AnimalsService;

  const mockAnimalsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnimalsController],
      providers: [
        {
          provide: AnimalsService,
          useValue: mockAnimalsService,
        },
      ],
    }).compile();

    controller = module.get<AnimalsController>(AnimalsController);
    animalsService = module.get<AnimalsService>(AnimalsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar animal com sucesso', async () => {
      const createDto: CreateAnimalDto = {
        name: 'Bessie',
        breed: 'Holstein',
        tag: 'ABC123',
        ownerId: 1,
      } as any;

      const created = createAnimal({ id: 1, ...createDto });
      mockAnimalsService.create.mockResolvedValue(created);

      const result = await controller.create(createDto);

      expect(animalsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toHaveProperty('statusCode', HttpStatus.CREATED);
      expect(result.data).toEqual(created);
    });

    it('deve propagar NotFoundException quando owner não existe', async () => {
      const createDto: CreateAnimalDto = {
        name: 'Bessie',
        breed: 'Holstein',
        tag: 'ABC123',
        ownerId: 999,
      } as any;

      const notFoundError = new NotFoundException('Usuário não encontrado.');
      mockAnimalsService.create.mockRejectedValue(notFoundError);

      await expect(controller.create(createDto)).rejects.toThrow(HttpException);
    });

    it('deve retornar BAD_REQUEST quando dados inválidos (Prisma error)', async () => {
      const createDto: CreateAnimalDto = {
        name: 'Bessie',
        breed: 'Holstein',
        tag: 'ABC123',
        ownerId: 1,
      } as any;

      const prismaError = new PrismaClientKnownRequestError(
        'Constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      mockAnimalsService.create.mockRejectedValue(prismaError);

      await expect(controller.create(createDto)).rejects.toThrow(HttpException);
      await expect(controller.create(createDto)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.BAD_REQUEST }),
      );
    });

    it('deve retornar INTERNAL_SERVER_ERROR para erros genéricos', async () => {
      const createDto: CreateAnimalDto = {
        name: 'Bessie',
        breed: 'Holstein',
        tag: 'ABC123',
        ownerId: 1,
      } as any;

      const genericError = new Error('Database connection failed');
      mockAnimalsService.create.mockRejectedValue(genericError);

      await expect(controller.create(createDto)).rejects.toThrow(HttpException);
      await expect(controller.create(createDto)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('findAll', () => {
    it('deve listar todos os animais', async () => {
      const animals = [createAnimal({ id: 1 }), createAnimal({ id: 2 })];
      mockAnimalsService.findAll.mockResolvedValue(animals);

      const result = await controller.findAll();

      expect(animalsService.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(animals);
    });

    it('deve lançar BadRequestException quando associationId inválido', async () => {
      await expect(controller.findAll('invalid' as any)).rejects.toThrow(
        HttpException,
      );
    });

    it('deve retornar INTERNAL_SERVER_ERROR quando service lança erro', async () => {
      const error = new Error('Database error');
      mockAnimalsService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(HttpException);
      await expect(controller.findAll()).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar animal por ID', async () => {
      const animal = createAnimal({ id: 1 });
      mockAnimalsService.findOne.mockResolvedValue(animal);

      const result = await controller.findOne(1);

      expect(animalsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(animal);
    });

    it('deve propagar NotFoundException quando animal não existe', async () => {
      const notFoundError = new NotFoundException('Animal não encontrado.');
      mockAnimalsService.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne(999)).rejects.toThrow(HttpException);
    });

    it('deve retornar INTERNAL_SERVER_ERROR para erros genéricos', async () => {
      const error = new Error('Unexpected error');
      mockAnimalsService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(1)).rejects.toThrow(HttpException);
      await expect(controller.findOne(1)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar animal com sucesso', async () => {
      const updateDto: UpdateAnimalDto = {
        name: 'Bessie Updated',
        breed: 'Holstein',
        tag: 'ABC1234',
      } as any;

      const updated = createAnimal({ id: 1, ...updateDto });
      mockAnimalsService.update.mockResolvedValue(updated);

      const result = await controller.update(1, updateDto);

      expect(animalsService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toHaveProperty('statusCode', HttpStatus.OK);
      expect(result.data).toEqual(updated);
    });

    it('deve propagar NotFoundException quando animal não existe', async () => {
      const updateDto: UpdateAnimalDto = {
        name: 'Nonexistent',
        breed: 'Breed',
        tag: 'T123',
      } as any;

      const notFoundError = new NotFoundException('Animal não encontrado.');
      mockAnimalsService.update.mockRejectedValue(notFoundError);

      await expect(controller.update(999, updateDto)).rejects.toThrow(
        HttpException,
      );
    });

    it('deve retornar BAD_REQUEST para dados inválidos (Prisma error)', async () => {
      const updateDto: UpdateAnimalDto = {
        name: 'Bessie',
        breed: 'Holstein',
        tag: 'ABC123',
      } as any;

      const prismaError = new PrismaClientKnownRequestError(
        'Constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      mockAnimalsService.update.mockRejectedValue(prismaError);

      await expect(controller.update(1, updateDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.update(1, updateDto)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.BAD_REQUEST }),
      );
    });

    it('deve retornar INTERNAL_SERVER_ERROR para erros genéricos', async () => {
      const updateDto: UpdateAnimalDto = {
        name: 'Bessie',
        breed: 'Holstein',
        tag: 'ABC123',
      } as any;

      const error = new Error('Database connection failed');
      mockAnimalsService.update.mockRejectedValue(error);

      await expect(controller.update(1, updateDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.update(1, updateDto)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('remove', () => {
    it('deve remover animal com sucesso', async () => {
      mockAnimalsService.remove.mockResolvedValue({
        message: 'Animal removido',
      });

      const result = await controller.remove(1);

      expect(animalsService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Animal removido' });
    });

    it('deve propagar NotFoundException quando animal não existe', async () => {
      const notFoundError = new NotFoundException('Animal não encontrado.');
      mockAnimalsService.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(999)).rejects.toThrow(HttpException);
    });

    it('deve retornar INTERNAL_SERVER_ERROR para erros genéricos', async () => {
      const error = new Error('Database deletion failed');
      mockAnimalsService.remove.mockRejectedValue(error);

      await expect(controller.remove(1)).rejects.toThrow(HttpException);
      await expect(controller.remove(1)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });
});

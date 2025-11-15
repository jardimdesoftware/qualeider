import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, NotFoundException, HttpException } from '@nestjs/common';
import { DailyCollectionsController } from '@/presentation/controllers/daily-collections.controller';
import { DailyCollectionsService } from '@/application/services/daily-collections/daily-collections.service';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { createDailyCollection } from '../../../factories/daily-collection.factory';
import { MilkingPlace } from '@/domain/enums/enums';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('DailyCollectionsController', () => {
  let controller: DailyCollectionsController;
  let service: DailyCollectionsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    checkIfUserAlreadySubmitted: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyCollectionsController],
      providers: [
        {
          provide: DailyCollectionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DailyCollectionsController>(
      DailyCollectionsController,
    );
    service = module.get<DailyCollectionsService>(DailyCollectionsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar coleta com sucesso', async () => {
      const dto: CreateDailyCollectionDto = {
        quantity: 10,
        userId: 1,
        numAnimals: 1,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      } as any;

      const created = createDailyCollection({ id: 1, userId: 1, quantity: 10 });
      mockService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('statusCode', HttpStatus.CREATED);
      expect(result.data).toEqual(created);
    });

    it('deve propagar NotFoundException quando usuário não existe', async () => {
      const dto: CreateDailyCollectionDto = {
        quantity: 10,
        userId: 999,
        numAnimals: 1,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      } as any;

      const notFoundError = new NotFoundException('Usuário não encontrado.');
      mockService.create.mockRejectedValue(notFoundError);

      await expect(controller.create(dto)).rejects.toThrow(HttpException);
    });

    it('deve retornar BAD_REQUEST quando dados inválidos (Prisma error)', async () => {
      const dto: CreateDailyCollectionDto = {
        quantity: 10,
        userId: 1,
        numAnimals: 1,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      } as any;

      const prismaError = new PrismaClientKnownRequestError(
        'Constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      mockService.create.mockRejectedValue(prismaError);

      await expect(controller.create(dto)).rejects.toThrow(HttpException);
      await expect(controller.create(dto)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.BAD_REQUEST }),
      );
    });

    it('deve retornar INTERNAL_SERVER_ERROR para erros genéricos', async () => {
      const dto: CreateDailyCollectionDto = {
        quantity: 10,
        userId: 1,
        numAnimals: 1,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      } as any;

      const error = new Error('Database connection failed');
      mockService.create.mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(HttpException);
      await expect(controller.create(dto)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('findAll', () => {
    it('deve listar todas as coletas', async () => {
      const items = [
        createDailyCollection({ id: 1 }),
        createDailyCollection({ id: 2 }),
      ];
      mockService.findAll.mockResolvedValue(items);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(items);
    });

    it('deve lançar BadRequestException quando associationId inválido', async () => {
      await expect(controller.findAll('invalid' as any)).rejects.toThrow(
        HttpException,
      );
    });

    it('deve retornar INTERNAL_SERVER_ERROR quando service lança erro', async () => {
      const error = new Error('Database error');
      mockService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(HttpException);
      await expect(controller.findAll()).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('checkIfUserAlreadySubmitted', () => {
    it('deve retornar status OK quando usuário já submeteu', async () => {
      const userId = '1';
      mockService.checkIfUserAlreadySubmitted.mockResolvedValue(true);

      const result = await controller.checkIfUserAlreadySubmitted(userId);

      expect(service.checkIfUserAlreadySubmitted).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('statusCode', HttpStatus.OK);
      expect(result.data).toBe(true);
    });

    it('deve lançar BadRequestException quando userId inválido', async () => {
      await expect(
        controller.checkIfUserAlreadySubmitted('invalid'),
      ).rejects.toThrow(HttpException);
    });

    it('deve retornar INTERNAL_SERVER_ERROR para erros genéricos', async () => {
      const userId = '1';
      const error = new Error('Database error');
      mockService.checkIfUserAlreadySubmitted.mockRejectedValue(error);

      await expect(
        controller.checkIfUserAlreadySubmitted(userId),
      ).rejects.toThrow(HttpException);
      await expect(
        controller.checkIfUserAlreadySubmitted(userId),
      ).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar formulário por ID', async () => {
      const item = createDailyCollection({ id: 1 });
      mockService.findOne.mockResolvedValue(item);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(item);
    });

    it('deve propagar NotFoundException quando formulário não existe', async () => {
      const notFoundError = new NotFoundException('Formulário não encontrado.');
      mockService.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne(999)).rejects.toThrow(HttpException);
    });

    it('deve retornar INTERNAL_SERVER_ERROR para erros genéricos', async () => {
      const error = new Error('Unexpected error');
      mockService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(1)).rejects.toThrow(HttpException);
      await expect(controller.findOne(1)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar formulário com sucesso', async () => {
      const updateDto: UpdateDailyCollectionDto = {
        quantity: 12,
      } as any;

      const updated = createDailyCollection({ id: 1, quantity: 12 });
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toHaveProperty('statusCode', HttpStatus.OK);
      expect(result.data).toEqual(updated);
    });

    it('deve propagar NotFoundException quando formulário não existe', async () => {
      const updateDto: UpdateDailyCollectionDto = {
        quantity: 1,
      } as any;

      const notFoundError = new NotFoundException('Formulário não encontrado.');
      mockService.update.mockRejectedValue(notFoundError);

      await expect(controller.update(999, updateDto)).rejects.toThrow(
        HttpException,
      );
    });

    it('deve retornar BAD_REQUEST para dados inválidos (Prisma error)', async () => {
      const updateDto: UpdateDailyCollectionDto = {
        quantity: 12,
      } as any;

      const prismaError = new PrismaClientKnownRequestError(
        'Constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      mockService.update.mockRejectedValue(prismaError);

      await expect(controller.update(1, updateDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.update(1, updateDto)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.BAD_REQUEST }),
      );
    });

    it('deve retornar INTERNAL_SERVER_ERROR para erros genéricos', async () => {
      const updateDto: UpdateDailyCollectionDto = {
        quantity: 12,
      } as any;

      const error = new Error('Database connection failed');
      mockService.update.mockRejectedValue(error);

      await expect(controller.update(1, updateDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.update(1, updateDto)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('remove', () => {
    it('deve remover formulário com sucesso', async () => {
      mockService.remove.mockResolvedValue({
        message: 'Coleta excluída com sucesso',
      });

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('statusCode', HttpStatus.OK);
    });

    it('deve propagar NotFoundException quando formulário não existe', async () => {
      const notFoundError = new NotFoundException('Formulário não encontrado.');
      mockService.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(999)).rejects.toThrow(HttpException);
    });

    it('deve retornar INTERNAL_SERVER_ERROR para erros genéricos', async () => {
      const error = new Error('Database deletion failed');
      mockService.remove.mockRejectedValue(error);

      await expect(controller.remove(1)).rejects.toThrow(HttpException);
      await expect(controller.remove(1)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('findAllByUserId', () => {
    it('deve retornar formulários do usuário', async () => {
      const items = [
        createDailyCollection({ id: 1, userId: 1 }),
        createDailyCollection({ id: 2, userId: 1 }),
      ];
      mockService.findAllByUserId.mockResolvedValue(items);

      const result = await controller.findAllByUserId(1);

      expect(service.findAllByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual(items);
    });

    it('deve propagar NotFoundException quando não há formulários para o usuário', async () => {
      const notFoundError = new NotFoundException(
        'Nenhum formulário encontrado para o usuário',
      );
      mockService.findAllByUserId.mockRejectedValue(notFoundError);

      await expect(controller.findAllByUserId(999)).rejects.toThrow(
        HttpException,
      );
    });

    it('deve retornar INTERNAL_SERVER_ERROR para erros genéricos', async () => {
      const error = new Error('Database query failed');
      mockService.findAllByUserId.mockRejectedValue(error);

      await expect(controller.findAllByUserId(1)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.findAllByUserId(1)).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });
});

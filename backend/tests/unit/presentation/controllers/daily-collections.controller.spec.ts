import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { DailyCollectionsController } from '@/presentation/controllers/daily-collections.controller';
import { DailyCollectionsService } from '@/application/services/daily-collections/daily-collections.service';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { createDailyCollection } from '../../../factories/daily-collection.factory';
import { MilkingPlace } from '@/domain/enums/enums';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

describe('DailyCollectionsController', () => {
  let controller: DailyCollectionsController;
  let service: DailyCollectionsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
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
    it('deve criar coleta com sucesso e retornar wrapper', async () => {
      const dto: CreateDailyCollectionDto = {
        quantity: 10,
        userId: 1,
        numAnimals: 1,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
      } as CreateDailyCollectionDto;

      const created = createDailyCollection({ id: 1, userId: 1, quantity: 10 });
      mockService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Coleta criada com sucesso',
        data: created,
      });
    });

    it('deve propagar EntityNotFoundException quando usuário não existe', async () => {
      const dto: CreateDailyCollectionDto = { userId: 999 } as any;
      const error = new EntityNotFoundException('Usuário não encontrado.');

      mockService.create.mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('deve propagar erro genérico (ex: conflito de banco)', async () => {
      const dto: CreateDailyCollectionDto = { userId: 1 } as any;
      const error = new Error('Unique constraint violation');

      mockService.create.mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow(
        'Unique constraint violation',
      );
    });
  });

  describe('findAll', () => {
    it('deve listar todas as coletas', async () => {
      const items = [createDailyCollection({ id: 1 })];
      mockService.findAll.mockResolvedValue(items);

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(items);
    });

    it('deve filtrar por associationId, userId e dateRange', async () => {
      const items = [createDailyCollection({ id: 1 })];
      mockService.findAll.mockResolvedValue(items);

      await controller.findAll({
        associationId: 10,
        userId: 5,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(service.findAll).toHaveBeenCalledWith({
        associationId: 10,
        userId: 5,
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-01-31'),
        },
      });
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

    it('deve propagar EntityNotFoundException quando formulário não existe', async () => {
      const error = new EntityNotFoundException('Formulário não encontrado.');
      mockService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(999)).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar formulário com sucesso e retornar wrapper', async () => {
      const updateDto: UpdateDailyCollectionDto = { quantity: 12 } as any;
      const updated = createDailyCollection({ id: 1, quantity: 12 });

      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Coleta atualizada com sucesso',
        data: updated,
      });
    });

    it('deve propagar EntityNotFoundException quando formulário não existe', async () => {
      const updateDto: UpdateDailyCollectionDto = { quantity: 1 } as any;
      const error = new EntityNotFoundException('Formulário não encontrado.');

      mockService.update.mockRejectedValue(error);

      await expect(controller.update(999, updateDto)).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover formulário com sucesso', async () => {
      const deleted = createDailyCollection({ id: 1 });
      mockService.remove.mockResolvedValue(deleted);

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Coleta excluída com sucesso',
        data: deleted,
      });
    });

    it('deve propagar EntityNotFoundException', async () => {
      const error = new EntityNotFoundException('Formulário não encontrado.');
      mockService.remove.mockRejectedValue(error);

      await expect(controller.remove(999)).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('findAllByUserId', () => {
    it('deve retornar formulários do usuário (mesmo vazio)', async () => {
      const items = [];
      mockService.findAll.mockResolvedValue(items);

      const result = await controller.findAllByUserId(1);

      expect(service.findAll).toHaveBeenCalledWith({ userId: 1 });
      expect(result).toEqual([]);
    });
  });
});

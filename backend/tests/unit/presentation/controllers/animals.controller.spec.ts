import { Test, TestingModule } from '@nestjs/testing';
import { AnimalsController } from '@/presentation/controllers/animals.controller';
import { AnimalsService } from '@/application/services/animals/animals.service';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { createAnimal } from '../../../factories/animal.factory';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BusinessException } from '@/common/exceptions/business.exception';

describe('AnimalsController', () => {
  let controller: AnimalsController;
  let animalsService: AnimalsService;

  const mockAnimalsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    inativar: jest.fn(),
    findAllByUserId: jest.fn(),
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
    it('deve criar animal com sucesso e retornar o resultado direto', async () => {
      const createDto: CreateAnimalDto = {
        name: 'Bessie',
        breed: 'Holstein',
        tag: 'ABC123',
        userId: 1,
        birthDate: new Date(),
      } as any;

      const created = createAnimal({ id: 1, ...createDto });
      mockAnimalsService.create.mockResolvedValue(created);

      const result = await controller.create(createDto);

      expect(animalsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(created);
    });

    it('deve propagar EntityNotFoundException se o service lançar', async () => {
      const createDto: CreateAnimalDto = { userId: 999 } as any;
      const error = new EntityNotFoundException('Usuário não encontrado.');
      
      mockAnimalsService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(EntityNotFoundException);
    });

    it('deve propagar BusinessException se o service lançar', async () => {
        const createDto: CreateAnimalDto = { userId: 1 } as any;
        const error = new BusinessException('Regra de negócio violada.');
        
        mockAnimalsService.create.mockRejectedValue(error);
  
        await expect(controller.create(createDto)).rejects.toThrow(BusinessException);
    });
  });

  describe('findAll', () => {
    it('deve listar todos os animais', async () => {
      const animals = [createAnimal({ id: 1 }), createAnimal({ id: 2 })];
      mockAnimalsService.findAll.mockResolvedValue(animals);

      const result = await controller.findAll({});

      expect(animalsService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(animals);
    });

    it('deve filtrar por associationId, userId e status', async () => {
      const animals = [createAnimal({ id: 1 })];
      mockAnimalsService.findAll.mockResolvedValue(animals);

      await controller.findAll({
        associationId: 10,
        userId: 5,
        status: 'Active',
      });

      expect(animalsService.findAll).toHaveBeenCalledWith({
        associationId: 10,
        userId: 5,
        status: 'Active',
      });
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

    it('deve propagar EntityNotFoundException quando animal não existe', async () => {
      const error = new EntityNotFoundException('Animal não encontrado.');
      mockAnimalsService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(999)).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar animal com sucesso e retornar o resultado direto', async () => {
      const updateDto: UpdateAnimalDto = { name: 'Bessie Updated' } as UpdateAnimalDto;
      const updated = createAnimal({ id: 1, ...updateDto });
      
      mockAnimalsService.update.mockResolvedValue(updated);

      const result = await controller.update(1, updateDto);

      expect(animalsService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updated);
    });

    it('deve propagar erro genérico do service', async () => {
      const updateDto: UpdateAnimalDto = { name: 'New' } as UpdateAnimalDto;
      const error = new Error('Database failure');
      
      mockAnimalsService.update.mockRejectedValue(error);

      await expect(controller.update(1, updateDto)).rejects.toThrow('Database failure');
    });
  });

  describe('remove', () => {
    it('deve remover animal com sucesso', async () => {
      const response = { id: 1, status: 'Inactive' };
      mockAnimalsService.remove.mockResolvedValue(response);

      const result = await controller.remove(1);

      expect(animalsService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(response);
    });

    it('deve propagar EntityNotFoundException', async () => {
      const error = new EntityNotFoundException('Animal não encontrado.');
      mockAnimalsService.remove.mockRejectedValue(error);

      await expect(controller.remove(999)).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('findAllByUserId', () => {
      it('deve retornar lista de animais do usuário', async () => {
          const animals = [createAnimal({ id: 1, userId: 5 })];
          mockAnimalsService.findAll.mockResolvedValue(animals);

          const result = await controller.findAllByUserId(5);

          expect(animalsService.findAll).toHaveBeenCalledWith({ userId: 5 });
          expect(result).toEqual(animals);
      });
  });
});
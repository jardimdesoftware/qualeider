import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { AnimalsService } from '@/application/services/animals/animals.service';
import { createAnimal } from '../../../factories/animal.factory';
import { createUser } from '../../../factories/user.factory';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { AnimalType, Status } from '@/domain/enums/enums';
import { IAnimalRepository, IAnimalRepository as IAnimalRepositorySymbol } from '@/domain/repositories/animal.repository';
import { IUserRepository, IUserRepository as IUserRepositorySymbol } from '@/domain/repositories/user.repository';

describe('AnimalsService', () => {
  let service: AnimalsService;
  let animalRepository: jest.Mocked<IAnimalRepository>;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimalsService,
        {
          provide: IAnimalRepositorySymbol,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            findAllByUserId: jest.fn(),
          },
        },
        {
          provide: IUserRepositorySymbol,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnimalsService>(AnimalsService);
    animalRepository = module.get(IAnimalRepositorySymbol);
    userRepository = module.get(IUserRepositorySymbol);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um animal com sucesso', async () => {
      const userId = 1;
      const mockUser = createUser({ id: userId });
      const createDto: CreateAnimalDto = {
        name: 'Mimosa',
        animalType: AnimalType.Vaca,
        breed: 'Holandesa',
        age: 5,
        userId,
      };
      const mockAnimal = createAnimal({ ...createDto, id: 1 });

      userRepository.findById.mockResolvedValue(mockUser);
      animalRepository.create.mockResolvedValue(mockAnimal);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAnimal);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(animalRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      const createDto: CreateAnimalDto = {
        name: 'Estrela',
        animalType: AnimalType.Vaca,
        breed: 'Jersey',
        age: 3,
        userId: 999,
      };

      userRepository.findById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Usuário com ID 999 não encontrado.',
      );
      expect(animalRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os animais', async () => {
      const mockAnimals = [
        createAnimal({ id: 1, name: 'Animal 1' }),
        createAnimal({ id: 2, name: 'Animal 2' }),
      ];

      animalRepository.findAll.mockResolvedValue(mockAnimals);

      const result = await service.findAll();

      expect(result).toEqual(mockAnimals);
      expect(animalRepository.findAll).toHaveBeenCalled();
    });

    it('deve filtrar por associationId quando fornecido', async () => {
      const associationId = 10;
      const mockAnimals = [createAnimal({ id: 1 })];

      animalRepository.findAll.mockResolvedValue(mockAnimals);

      const result = await service.findAll({ associationId });

      expect(result).toEqual(mockAnimals);
      expect(animalRepository.findAll).toHaveBeenCalledWith({ associationId });
    });

    it('deve retornar array vazio quando não há animais', async () => {
      animalRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('deve retornar um animal por ID', async () => {
      const mockAnimal = createAnimal({ id: 1, name: 'Mimosa' });

      animalRepository.findById.mockResolvedValue(mockAnimal);

      const result = await service.findOne(1);

      expect(result).toEqual(mockAnimal);
      expect(animalRepository.findById).toHaveBeenCalledWith(1);
    });

    it('deve lançar NotFoundException se animal não existe', async () => {
      animalRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.findOne(999)).rejects.toThrow(
        'Animal com ID 999 não encontrado.',
      );
    });
  });

  describe('update', () => {
    it('deve atualizar um animal com sucesso', async () => {
      const updateDto: Partial<UpdateAnimalDto> = {
        name: 'Mimosa Atualizada',
        age: 6,
      };
      const mockExistingAnimal = createAnimal({ id: 1, name: 'Mimosa', age: 5 });
      const mockUpdatedAnimal = createAnimal({ id: 1, ...updateDto });

      animalRepository.findById.mockResolvedValue(mockExistingAnimal);
      animalRepository.update.mockResolvedValue(mockUpdatedAnimal);

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(mockUpdatedAnimal);
      expect(animalRepository.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('deve permitir atualizar apenas alguns campos', async () => {
      const updateDto: Partial<UpdateAnimalDto> = {
        breed: 'Gir',
      };
      const mockExistingAnimal = createAnimal({ id: 1, breed: 'Holandesa' });
      const mockUpdatedAnimal = createAnimal({ id: 1, breed: 'Gir' });

      animalRepository.findById.mockResolvedValue(mockExistingAnimal);
      animalRepository.update.mockResolvedValue(mockUpdatedAnimal);

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(mockUpdatedAnimal);
      expect(animalRepository.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('deve lançar NotFoundException ao tentar atualizar animal inexistente', async () => {
        animalRepository.findById.mockResolvedValue(null);
        
        const updateDto: Partial<UpdateAnimalDto> = { name: 'Novo Nome' };

        await expect(service.update(999, updateDto as any)).rejects.toThrow(EntityNotFoundException);
        expect(animalRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve desativar (soft delete) um animal', async () => {
      const mockAnimal = createAnimal({ id: 1, status: Status.Active });
      
      animalRepository.findById.mockResolvedValue(mockAnimal);
      animalRepository.softDelete.mockResolvedValue();

      await service.remove(1);

      expect(animalRepository.findById).toHaveBeenCalledWith(1);
      expect(animalRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('deve lançar NotFoundException ao tentar remover animal inexistente', async () => {
        animalRepository.findById.mockResolvedValue(null);

        await expect(service.remove(999)).rejects.toThrow(EntityNotFoundException);
        expect(animalRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('findAllByUserId', () => {
    it('deve retornar todos os animais ativos de um usuário', async () => {
      const userId = 1;
      const mockAnimals = [
        createAnimal({ id: 1, userId, name: 'Animal 1' }),
        createAnimal({ id: 2, userId, name: 'Animal 2' }),
      ];

      animalRepository.findAll.mockResolvedValue(mockAnimals);

      // The service doesn't have findAllByUserId anymore, so we test findAll with criteria
      const result = await service.findAll({ userId });

      expect(result).toEqual(mockAnimals);
      expect(animalRepository.findAll).toHaveBeenCalledWith({ userId });
    });

    it('deve retonar uma lista vazia se usuário não tem animais', async () => {
      animalRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll({ userId: 999 });

      expect(result).toEqual([]);
      expect(animalRepository.findAll).toHaveBeenCalledWith({ userId: 999 });
    });
  });
});

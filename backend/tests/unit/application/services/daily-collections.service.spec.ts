import { Test, TestingModule } from '@nestjs/testing';
import { DailyCollectionsService } from '@/application/services/daily-collections/daily-collections.service';
import { createDailyCollection } from '../../../factories/daily-collection.factory';
import { createUser } from '../../../factories/user.factory';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { MilkingPlace } from '@/domain/enums/enums';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { IDailyCollectionRepository, IDailyCollectionRepository as IDailyCollectionRepositorySymbol } from '@/domain/repositories/daily-collection.repository';
import { IUserRepository, IUserRepository as IUserRepositorySymbol } from '@/domain/repositories/user.repository';
import { IAnimalRepository, IAnimalRepository as IAnimalRepositorySymbol } from '@/domain/repositories/animal.repository';
import { BusinessException } from '@/common/exceptions/business.exception';
import { createAnimal } from '../../../factories/animal.factory';

describe('DailyCollectionsService', () => {
  let service: DailyCollectionsService;
  let dailyCollectionRepository: jest.Mocked<IDailyCollectionRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let animalRepository: jest.Mocked<IAnimalRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyCollectionsService,
        {
          provide: IDailyCollectionRepositorySymbol,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            updateItems: jest.fn(),
            delete: jest.fn(),
            findAllByUserId: jest.fn(),
          },
        },
        {
          provide: IAnimalRepositorySymbol,
          useValue: {
            findById: jest.fn(),
            findByIds: jest.fn(),
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

    service = module.get<DailyCollectionsService>(DailyCollectionsService);
    dailyCollectionRepository = module.get(IDailyCollectionRepositorySymbol);
    userRepository = module.get(IUserRepositorySymbol);
    animalRepository = module.get(IAnimalRepositorySymbol);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDailyCollectionDto: CreateDailyCollectionDto = {
      quantity: 50.5,
      userId: 1,
      numAnimals: 10,
      numOrdens: 2,
      rationProvided: true,
      numLactation: 3,
      milkingPlace: MilkingPlace.Curral,
      technicalAssistance: false,
      collectionDate: new Date(),
      items: [
        { animalId: 10, quantity: 25.25 },
        { animalId: 11, quantity: 25.25 }
      ],
    };

    it('deve criar uma coleta diária com sucesso', async () => {
      const userId = 1;
      const mockUser = createUser({ id: userId });
      const mockDailyCollection = createDailyCollection({ id: 1, userId });
      const mockAnimals = [
        createAnimal({ id: 10, userId }),
        createAnimal({ id: 11, userId }),
      ];

      userRepository.findById.mockResolvedValue(mockUser);
      animalRepository.findByIds.mockResolvedValue(mockAnimals);
      dailyCollectionRepository.create.mockResolvedValue(mockDailyCollection);

      const result = await service.create(createDailyCollectionDto);

      expect(result).toEqual(mockDailyCollection);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(dailyCollectionRepository.create).toHaveBeenCalledWith(createDailyCollectionDto);
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      const createDto: CreateDailyCollectionDto = {
        quantity: 30.0,
        userId: 999,
        numAnimals: 5,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        collectionDate: new Date(),
        items: [],
      };

      userRepository.findById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        EntityNotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Usuário com ID 999 não encontrado.',
      );
      expect(dailyCollectionRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar BusinessException se data de coleta for futura', async () => {
      const userId = 1;
      const mockUser = createUser({ id: userId });
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const createDto: CreateDailyCollectionDto = {
        quantity: 50.0,
        userId,
        numAnimals: 10,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 3,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        collectionDate: futureDate,
        items: [],
      };

      userRepository.findById.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(BusinessException);
      await expect(service.create(createDto)).rejects.toThrow('Data de coleta não pode ser futura');
      expect(dailyCollectionRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar BusinessException se soma dos items não bater com quantity', async () => {
      const userId = 1;
      const mockUser = createUser({ id: userId });

      const createDto: CreateDailyCollectionDto = {
        quantity: 100.0,
        userId,
        numAnimals: 2,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        collectionDate: new Date(),
        items: [
          { animalId: 1, quantity: 30.0 },
          { animalId: 2, quantity: 25.0 },
        ],
      };

      userRepository.findById.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(BusinessException);
      await expect(service.create(createDto)).rejects.toThrow(/Soma dos items.*não corresponde/);
      expect(dailyCollectionRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar EntityNotFoundException se animal não existe', async () => {
      const userId = 1;
      const mockUser = createUser({ id: userId });

      const createDto: CreateDailyCollectionDto = {
        quantity: 50.0,
        userId,
        numAnimals: 2,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        collectionDate: new Date(),
        items: [
          { animalId: 999, quantity: 50.0 },
        ],
      };

      userRepository.findById.mockResolvedValue(mockUser);
      animalRepository.findByIds.mockResolvedValue([]);

      await expect(service.create(createDto)).rejects.toThrow(EntityNotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Um ou mais animais não foram encontrados');
      expect(dailyCollectionRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar BusinessException se animal não pertence ao usuário', async () => {
      const userId = 1;
      const mockUser = createUser({ id: userId });
      const mockAnimal = createAnimal({ id: 10, userId: 999 });

      const createDto: CreateDailyCollectionDto = {
        quantity: 50.0,
        userId,
        numAnimals: 1,
        numOrdens: 1,
        rationProvided: false,
        numLactation: 1,
        milkingPlace: MilkingPlace.Aberto,
        technicalAssistance: false,
        collectionDate: new Date(),
        items: [
          { animalId: 10, quantity: 50.0 },
        ],
      };

      userRepository.findById.mockResolvedValue(mockUser);
      animalRepository.findByIds.mockResolvedValue([mockAnimal]);

      await expect(service.create(createDto)).rejects.toThrow(BusinessException);
      await expect(service.create(createDto)).rejects.toThrow('Animal com ID 10 não pertence ao usuário');
      expect(dailyCollectionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as coletas diárias', async () => {
      const mockCollections = [
        createDailyCollection({ id: 1, quantity: 50 }),
        createDailyCollection({ id: 2, quantity: 60 }),
      ];

      const paginatedResult = {
        data: mockCollections,
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      dailyCollectionRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll();

      expect(result).toEqual(paginatedResult);
      expect(dailyCollectionRepository.findAll).toHaveBeenCalled();
    });

    it('deve filtrar por associationId quando fornecido', async () => {
      const associationId = 10;
      const mockCollections = [createDailyCollection({ id: 1 })];

      const paginatedResult = {
        data: mockCollections,
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      dailyCollectionRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll({ associationId });

      expect(result).toEqual(paginatedResult);
      expect(dailyCollectionRepository.findAll).toHaveBeenCalledWith({ associationId });
    });

    it('deve retornar array vazio quando não há coletas', async () => {
      const paginatedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      dailyCollectionRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll();

      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma coleta diária por ID', async () => {
      const mockCollection = createDailyCollection({ id: 1, quantity: 45.5 });

      dailyCollectionRepository.findById.mockResolvedValue(mockCollection);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCollection);
      expect(dailyCollectionRepository.findById).toHaveBeenCalledWith(1);
    });

    it('deve lançar NotFoundException se coleta não existe', async () => {
      dailyCollectionRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(EntityNotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Coleta diária com ID 999 não encontrada.',
      );
    });
  });

  describe('update', () => {
    it('deve atualizar uma coleta diária com sucesso', async () => {
      const updateDto: Partial<UpdateDailyCollectionDto> = {
        quantity: 55.0,
        numAnimals: 12,
      };
      const mockExistingCollection = createDailyCollection({ id: 1, quantity: 50 });
      const mockUpdatedCollection = createDailyCollection({
        id: 1,
        quantity: 55.0,
        numAnimals: 12,
      });

      dailyCollectionRepository.findById
        .mockResolvedValueOnce(mockExistingCollection)
        .mockResolvedValueOnce(mockUpdatedCollection);
      dailyCollectionRepository.update.mockResolvedValue(mockUpdatedCollection);

      const result = await service.update(1, updateDto as any);

      expect(dailyCollectionRepository.findById).toHaveBeenCalledTimes(2);
      expect(dailyCollectionRepository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockUpdatedCollection);
    });

    it('deve permitir atualizar apenas alguns campos', async () => {
      const updateDto: Partial<UpdateDailyCollectionDto> = {
        technicalAssistance: true,
      };
      const mockExistingCollection = createDailyCollection({ id: 1, technicalAssistance: false });
      const mockUpdatedCollection = createDailyCollection({
        id: 1,
        technicalAssistance: true,
      });

      dailyCollectionRepository.findById
        .mockResolvedValueOnce(mockExistingCollection)
        .mockResolvedValueOnce(mockUpdatedCollection);
      dailyCollectionRepository.update.mockResolvedValue(mockUpdatedCollection);

      const result = await service.update(1, updateDto as any);

      expect(dailyCollectionRepository.findById).toHaveBeenCalledTimes(2);
      expect(dailyCollectionRepository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockUpdatedCollection);
    });

    it('deve atualizar coleta diária e seus items quando items forem fornecidos', async () => {
      const updateDto: UpdateDailyCollectionDto = {
        quantity: 60.0,
        numAnimals: 2,
        items: [
          { animalId: 1, quantity: 30.0 },
          { animalId: 2, quantity: 30.0 },
        ],
      } as any;

      const mockExistingCollection = createDailyCollection({ id: 1, quantity: 50 });
      const mockUpdatedCollection = createDailyCollection({
        id: 1,
        quantity: 60.0,
        numAnimals: 2,
        items: [
          { id: 1, dailyCollectionId: 1, animalId: 1, quantity: 30.0 },
          { id: 2, dailyCollectionId: 1, animalId: 2, quantity: 30.0 },
        ],
      });

      dailyCollectionRepository.findById
        .mockResolvedValueOnce(mockExistingCollection)
        .mockResolvedValueOnce(mockUpdatedCollection);
      dailyCollectionRepository.update.mockResolvedValue(mockUpdatedCollection);
      dailyCollectionRepository.updateItems.mockResolvedValue(undefined);

      const result = await service.update(1, updateDto);

      expect(dailyCollectionRepository.findById).toHaveBeenCalledTimes(2);
      expect(dailyCollectionRepository.findById).toHaveBeenNthCalledWith(1, 1);
      expect(dailyCollectionRepository.findById).toHaveBeenNthCalledWith(2, 1);
      expect(dailyCollectionRepository.update).toHaveBeenCalledWith(1, {
        quantity: 60.0,
        numAnimals: 2,
      });
      expect(dailyCollectionRepository.updateItems).toHaveBeenCalledWith(1, updateDto.items);
      expect(result).toEqual(mockUpdatedCollection);
      expect(result).toBeDefined();
      expect(result?.items).toHaveLength(2);
    });

    it('não deve chamar updateItems quando items não forem fornecidos', async () => {
      const updateDto: Partial<UpdateDailyCollectionDto> = {
        quantity: 55.0,
      };
      const mockExistingCollection = createDailyCollection({ id: 1 });
      const mockUpdatedCollection = createDailyCollection({ id: 1, quantity: 55.0 });

      dailyCollectionRepository.findById
        .mockResolvedValueOnce(mockExistingCollection)
        .mockResolvedValueOnce(mockUpdatedCollection);
      dailyCollectionRepository.update.mockResolvedValue(mockUpdatedCollection);

      await service.update(1, updateDto as any);

      expect(dailyCollectionRepository.updateItems).not.toHaveBeenCalled();
    });

    it('não deve chamar updateItems quando items for array vazio', async () => {
      const updateDto: Partial<UpdateDailyCollectionDto> = {
        quantity: 55.0,
        items: [],
      };
      const mockExistingCollection = createDailyCollection({ id: 1 });
      const mockUpdatedCollection = createDailyCollection({ id: 1, quantity: 55.0 });

      dailyCollectionRepository.findById
        .mockResolvedValueOnce(mockExistingCollection)
        .mockResolvedValueOnce(mockUpdatedCollection);
      dailyCollectionRepository.update.mockResolvedValue(mockUpdatedCollection);

      await service.update(1, updateDto as any);

      expect(dailyCollectionRepository.updateItems).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException ao tentar atualizar coleta inexistente', async () => {
        dailyCollectionRepository.findById.mockResolvedValue(null);
        
        const updateDto: Partial<UpdateDailyCollectionDto> = { quantity: 100 };

        await expect(service.update(999, updateDto as any)).rejects.toThrow(EntityNotFoundException);
        expect(dailyCollectionRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve deletar (hard delete) uma coleta diária', async () => {
      const mockCollection = createDailyCollection({ id: 1 });
      
      dailyCollectionRepository.findById.mockResolvedValue(mockCollection);
      dailyCollectionRepository.delete.mockResolvedValue(undefined);

      await service.remove(1);

      expect(dailyCollectionRepository.findById).toHaveBeenCalledWith(1);
      expect(dailyCollectionRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deve lançar NotFoundException ao tentar remover coleta inexistente', async () => {
        dailyCollectionRepository.findById.mockResolvedValue(null);

        await expect(service.remove(999)).rejects.toThrow(EntityNotFoundException);
        expect(dailyCollectionRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('findAll with criteria to get User by Id', () => {
    it('deve retornar todas as coletas de um usuário', async () => {
      const userId = 1;
      const mockCollections = [
        createDailyCollection({ id: 1, userId, quantity: 40 }),
        createDailyCollection({ id: 2, userId, quantity: 50 }),
      ];

      const paginatedResult = {
        data: mockCollections,
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      dailyCollectionRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll({ userId });

      expect(result).toEqual(paginatedResult);
      expect(dailyCollectionRepository.findAll).toHaveBeenCalledWith({ userId });
    });

    it('deve retornar array vazio se usuário não tem coletas', async () => {
      const paginatedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      dailyCollectionRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll({ userId: 999 });

      expect(result).toEqual(paginatedResult); 
      expect(dailyCollectionRepository.findAll).toHaveBeenCalledWith({ userId: 999 });
    });
  });
});

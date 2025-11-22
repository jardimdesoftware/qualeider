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

describe('DailyCollectionsService', () => {
  let service: DailyCollectionsService;
  let dailyCollectionRepository: jest.Mocked<IDailyCollectionRepository>;
  let userRepository: jest.Mocked<IUserRepository>;

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
            delete: jest.fn(),
            findAllByUserId: jest.fn(),
            checkIfUserAlreadySubmitted: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma coleta diária com sucesso', async () => {
      const userId = 1;
      const mockUser = createUser({ id: userId });
      const createDto: CreateDailyCollectionDto = {
        quantity: 50.5,
        userId,
        numAnimals: 10,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 3,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: false,
        collectionDate: new Date(),
      };
      const mockCollection = createDailyCollection({ ...createDto, id: 1 });

      userRepository.findById.mockResolvedValue(mockUser);
      dailyCollectionRepository.create.mockResolvedValue(mockCollection);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCollection);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(dailyCollectionRepository.create).toHaveBeenCalledWith(createDto);
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
  });

  describe('findAll', () => {
    it('deve retornar todas as coletas diárias', async () => {
      const mockCollections = [
        createDailyCollection({ id: 1, quantity: 50 }),
        createDailyCollection({ id: 2, quantity: 60 }),
      ];

      dailyCollectionRepository.findAll.mockResolvedValue(mockCollections);

      const result = await service.findAll();

      expect(result).toEqual(mockCollections);
      expect(dailyCollectionRepository.findAll).toHaveBeenCalled();
    });

    it('deve filtrar por associationId quando fornecido', async () => {
      const associationId = 10;
      const mockCollections = [createDailyCollection({ id: 1 })];

      dailyCollectionRepository.findAll.mockResolvedValue(mockCollections);

      const result = await service.findAll({ associationId });

      expect(result).toEqual(mockCollections);
      expect(dailyCollectionRepository.findAll).toHaveBeenCalledWith({ associationId });
    });

    it('deve retornar array vazio quando não há coletas', async () => {
      dailyCollectionRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
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
        ...updateDto,
      });

      dailyCollectionRepository.findById.mockResolvedValue(mockExistingCollection);
      dailyCollectionRepository.update.mockResolvedValue(mockUpdatedCollection);

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(mockUpdatedCollection);
      expect(dailyCollectionRepository.update).toHaveBeenCalledWith(1, updateDto);
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

      dailyCollectionRepository.findById.mockResolvedValue(mockExistingCollection);
      dailyCollectionRepository.update.mockResolvedValue(mockUpdatedCollection);

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(mockUpdatedCollection);
      expect(dailyCollectionRepository.update).toHaveBeenCalledWith(1, updateDto);
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

      dailyCollectionRepository.findAll.mockResolvedValue(mockCollections);

      const result = await service.findAll({ userId });

      expect(result).toEqual(mockCollections);
      expect(dailyCollectionRepository.findAll).toHaveBeenCalledWith({ userId });
    });

    it('deve retornar array vazio se usuário não tem coletas', async () => {
      dailyCollectionRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll({ userId: 999 });

      expect(result).toEqual([]); 
      expect(dailyCollectionRepository.findAll).toHaveBeenCalledWith({ userId: 999 });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DailyCollectionsService } from '@/application/services/daily-collections/daily-collections.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { createDailyCollection } from '../../../factories/daily-collection.factory';
import { createUser } from '../../../factories/user.factory';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { MilkingPlace } from '@/domain/enums/enums';

describe('DailyCollectionsService', () => {
  let service: DailyCollectionsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyCollectionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DailyCollectionsService>(DailyCollectionsService);
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
      };
      const mockCollection = createDailyCollection({ ...createDto, id: 1 });

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.dailyCollection.create.mockResolvedValue(mockCollection as any);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCollection);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prisma.dailyCollection.create).toHaveBeenCalledWith({
        data: createDto,
      });
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
      };

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Usuário com ID 999 não encontrado.',
      );
      expect(prisma.dailyCollection.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as coletas diárias', async () => {
      const mockCollections = [
        createDailyCollection({ id: 1, quantity: 50 }),
        createDailyCollection({ id: 2, quantity: 60 }),
      ];

      prisma.dailyCollection.findMany.mockResolvedValue(mockCollections as any);

      const result = await service.findAll();

      expect(result).toEqual(mockCollections);
      expect(prisma.dailyCollection.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          user: {
            select: {
              id: true,
              name: true,
              associationId: true,
            },
          },
        },
        orderBy: {
          collectionDate: 'desc',
        },
      });
    });

    it('deve filtrar por associationId quando fornecido', async () => {
      const associationId = 10;
      const mockCollections = [createDailyCollection({ id: 1 })];

      prisma.dailyCollection.findMany.mockResolvedValue(mockCollections as any);

      const result = await service.findAll(associationId);

      expect(result).toEqual(mockCollections);
      expect(prisma.dailyCollection.findMany).toHaveBeenCalledWith({
        where: {
          user: {
            associationId: associationId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              associationId: true,
            },
          },
        },
        orderBy: {
          collectionDate: 'desc',
        },
      });
    });

    it('deve retornar array vazio quando não há coletas', async () => {
      prisma.dailyCollection.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('checkIfUserAlreadySubmitted', () => {
    it('deve retornar true se usuário já enviou formulário', async () => {
      const userId = 1;
      const mockCollection = createDailyCollection({ userId });

      prisma.dailyCollection.findFirst.mockResolvedValue(mockCollection as any);

      const result = await service.checkIfUserAlreadySubmitted(userId);

      expect(result).toBe(true);
      expect(prisma.dailyCollection.findFirst).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('deve retornar false se usuário não enviou formulário', async () => {
      prisma.dailyCollection.findFirst.mockResolvedValue(null);

      const result = await service.checkIfUserAlreadySubmitted(999);

      expect(result).toBe(false);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma coleta diária por ID', async () => {
      const mockCollection = createDailyCollection({ id: 1, quantity: 45.5 });

      prisma.dailyCollection.findUnique.mockResolvedValue(
        mockCollection as any,
      );

      const result = await service.findOne(1);

      expect(result).toEqual(mockCollection);
      expect(prisma.dailyCollection.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve lançar NotFoundException se coleta não existe', async () => {
      prisma.dailyCollection.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
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
      const mockUpdatedCollection = createDailyCollection({
        id: 1,
        ...updateDto,
      });

      prisma.dailyCollection.update.mockResolvedValue(
        mockUpdatedCollection as any,
      );

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(mockUpdatedCollection);
      expect(prisma.dailyCollection.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });

    it('deve permitir atualizar apenas alguns campos', async () => {
      const updateDto: Partial<UpdateDailyCollectionDto> = {
        technicalAssistance: true,
      };
      const mockUpdatedCollection = createDailyCollection({
        id: 1,
        technicalAssistance: true,
      });

      prisma.dailyCollection.update.mockResolvedValue(
        mockUpdatedCollection as any,
      );

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(mockUpdatedCollection);
      expect(prisma.dailyCollection.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('deve deletar (hard delete) uma coleta diária', async () => {
      const mockDeletedCollection = createDailyCollection({ id: 1 });

      prisma.dailyCollection.delete.mockResolvedValue(
        mockDeletedCollection as any,
      );

      const result = await service.remove(1);

      expect(result).toEqual(mockDeletedCollection);
      expect(prisma.dailyCollection.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('findAllByUserId', () => {
    it('deve retornar todas as coletas de um usuário', async () => {
      const userId = 1;
      const mockCollections = [
        createDailyCollection({ id: 1, userId, quantity: 40 }),
        createDailyCollection({ id: 2, userId, quantity: 50 }),
      ];

      prisma.dailyCollection.findMany.mockResolvedValue(mockCollections as any);

      const result = await service.findAllByUserId(userId);

      expect(result).toEqual(mockCollections);
      expect(prisma.dailyCollection.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('deve lançar NotFoundException se usuário não tem coletas', async () => {
      prisma.dailyCollection.findMany.mockResolvedValue([]);

      await expect(service.findAllByUserId(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findAllByUserId(999)).rejects.toThrow(
        'Nenhum formulário encontrado para o usuário com ID 999.',
      );
    });

    it('deve lançar NotFoundException se findMany retorna null', async () => {
      prisma.dailyCollection.findMany.mockResolvedValue(null as any);

      await expect(service.findAllByUserId(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnimalsService } from '@/application/services/animals/animals.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { createAnimal } from '../../../factories/animal.factory';
import { createUser } from '../../../factories/user.factory';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { AnimalType, Status } from '@/domain/enums/enums';

describe('AnimalsService', () => {
  let service: AnimalsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AnimalsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AnimalsService>(AnimalsService);
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

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.animal.create.mockResolvedValue(mockAnimal as any);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAnimal);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prisma.animal.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      const createDto: CreateAnimalDto = {
        name: 'Estrela',
        animalType: AnimalType.Vaca,
        breed: 'Jersey',
        age: 3,
        userId: 999,
      };

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Usuário com ID 999 não encontrado.',
      );
      expect(prisma.animal.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os animais ativos', async () => {
      const mockAnimals = [
        createAnimal({ id: 1, name: 'Animal 1' }),
        createAnimal({ id: 2, name: 'Animal 2' }),
      ];

      prisma.animal.findMany.mockResolvedValue(mockAnimals as any);

      const result = await service.findAll();

      expect(result).toEqual(mockAnimals);
      expect(prisma.animal.findMany).toHaveBeenCalledWith({
        where: { status: 'Active' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              associationId: true,
            },
          },
        },
      });
    });

    it('deve filtrar por associationId quando fornecido', async () => {
      const associationId = 10;
      const mockAnimals = [createAnimal({ id: 1 })];

      prisma.animal.findMany.mockResolvedValue(mockAnimals as any);

      const result = await service.findAll(associationId);

      expect(result).toEqual(mockAnimals);
      expect(prisma.animal.findMany).toHaveBeenCalledWith({
        where: {
          status: 'Active',
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
      });
    });

    it('deve retornar array vazio quando não há animais', async () => {
      prisma.animal.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('deve retornar um animal por ID', async () => {
      const mockAnimal = createAnimal({ id: 1, name: 'Mimosa' });

      prisma.animal.findUnique.mockResolvedValue(mockAnimal as any);

      const result = await service.findOne(1);

      expect(result).toEqual(mockAnimal);
      expect(prisma.animal.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve lançar NotFoundException se animal não existe', async () => {
      prisma.animal.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
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
      const mockUpdatedAnimal = createAnimal({ id: 1, ...updateDto });

      prisma.animal.update.mockResolvedValue(mockUpdatedAnimal as any);

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(mockUpdatedAnimal);
      expect(prisma.animal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });

    it('deve permitir atualizar apenas alguns campos', async () => {
      const updateDto: Partial<UpdateAnimalDto> = {
        breed: 'Gir',
      };
      const mockUpdatedAnimal = createAnimal({ id: 1, breed: 'Gir' });

      prisma.animal.update.mockResolvedValue(mockUpdatedAnimal as any);

      const result = await service.update(1, updateDto as any);

      expect(result).toEqual(mockUpdatedAnimal);
      expect(prisma.animal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('deve desativar (soft delete) um animal', async () => {
      const mockDeactivatedAnimal = createAnimal({
        id: 1,
        status: Status.Inactive,
      });

      prisma.animal.update.mockResolvedValue(mockDeactivatedAnimal as any);

      const result = await service.remove(1);

      expect(result).toEqual(mockDeactivatedAnimal);
      expect(prisma.animal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'Inactive' },
      });
    });
  });

  describe('findAllByUserId', () => {
    it('deve retornar todos os animais ativos de um usuário', async () => {
      const userId = 1;
      const mockAnimals = [
        createAnimal({ id: 1, userId, name: 'Animal 1' }),
        createAnimal({ id: 2, userId, name: 'Animal 2' }),
      ];

      prisma.animal.findMany.mockResolvedValue(mockAnimals as any);

      const result = await service.findAllByUserId(userId);

      expect(result).toEqual(mockAnimals);
      expect(prisma.animal.findMany).toHaveBeenCalledWith({
        where: { userId, status: 'Active' },
      });
    });

    it('deve lançar NotFoundException se usuário não tem animais', async () => {
      prisma.animal.findMany.mockResolvedValue([]);

      await expect(service.findAllByUserId(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findAllByUserId(999)).rejects.toThrow(
        'Nenhum animal encontrado para o usuário com ID 999.',
      );
    });

    it('deve lançar NotFoundException se findMany retorna null', async () => {
      prisma.animal.findMany.mockResolvedValue(null as any);

      await expect(service.findAllByUserId(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

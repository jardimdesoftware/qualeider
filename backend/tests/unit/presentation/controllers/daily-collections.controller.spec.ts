import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { DailyCollectionsController } from '@/presentation/controllers/daily-collections.controller';
import { DailyCollectionsService } from '@/application/services/daily-collections/daily-collections.service';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { createDailyCollection } from '../../../factories/daily-collection.factory';
import { MilkingPlace, UserRole } from '@/domain/enums/enums';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { MAX_LIMIT } from '@/domain/common/pagination.interface';

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
    findHistoryByAnimal: jest.fn(),
    assertCanReadUserData: jest.fn(),
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
    it('deve criar coleta com sucesso e retornar o resultado direto', async () => {
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

      const result = await controller.create(dto, 1, UserRole.ADMIN, null, null);

      expect(service.create).toHaveBeenCalledWith(dto, {
        id: 1,
        role: UserRole.ADMIN,
        associationId: null,
        adminId: null,
      });
      expect(result).toEqual(created);
    });

    it('deve propagar EntityNotFoundException quando usuário não existe', async () => {
      const dto: CreateDailyCollectionDto = { userId: 999 } as any;
      const error = new EntityNotFoundException('Usuário não encontrado.');

      mockService.create.mockRejectedValue(error);

      await expect(controller.create(dto, 1, UserRole.ADMIN, null, null)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('deve propagar erro genérico (ex: conflito de banco)', async () => {
      const dto: CreateDailyCollectionDto = { userId: 1 } as any;
      const error = new Error('Unique constraint violation');

      mockService.create.mockRejectedValue(error);

      await expect(controller.create(dto, 1, UserRole.ADMIN, null, null)).rejects.toThrow(
        'Unique constraint violation',
      );
    });
  });

  const adminA = { id: 1, userType: 'user', role: UserRole.ADMIN, associationId: null, adminId: null };

  describe('findAll', () => {
    it('lista sempre dentro do escopo de quem pede', async () => {
      const items = [createDailyCollection({ id: 1 })];
      mockService.findAll.mockResolvedValue(items);

      const result = await controller.findAll({}, adminA);

      expect(service.findAll).toHaveBeenCalledWith({ scope: { adminGroupId: 1 } });
      expect(result).toEqual(items);
    });

    it('os filtros da query são somados ao escopo, nunca o substituem', async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll(
        { associationId: 10, userId: 5, startDate: '2025-01-01', endDate: '2025-01-31' },
        adminA,
      );

      expect(service.findAll).toHaveBeenCalledWith({
        scope: { adminGroupId: 1 },
        associationId: 10,
        userId: 5,
        dateRange: { start: new Date('2025-01-01'), end: new Date('2025-01-31') },
      });
    });
  });

  describe('findOne', () => {
    it('retorna a coleta, checando o escopo de quem pede', async () => {
      const item = createDailyCollection({ id: 1 });
      mockService.findOne.mockResolvedValue(item);

      const result = await controller.findOne(1, adminA);

      expect(service.findOne).toHaveBeenCalledWith(1, adminA);
      expect(result).toEqual(item);
    });

    it('propaga EntityNotFoundException quando a coleta não existe', async () => {
      mockService.findOne.mockRejectedValue(new EntityNotFoundException('Formulário não encontrado.'));

      await expect(controller.findOne(999, adminA)).rejects.toThrow(EntityNotFoundException);
    });

    it('propaga ForbiddenException quando a coleta é de outro dono', async () => {
      mockService.findOne.mockRejectedValue(new ForbiddenException('outro dono'));

      await expect(controller.findOne(5, adminA)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('deve atualizar formulário com sucesso e retornar o resultado direto', async () => {
      const updateDto: UpdateDailyCollectionDto = { quantity: 12 } as any;
      const updated = createDailyCollection({ id: 1, quantity: 12 });

      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(1, updateDto, 1, UserRole.ADMIN, null, null);

      expect(service.update).toHaveBeenCalledWith(1, updateDto, {
        id: 1,
        role: UserRole.ADMIN,
        associationId: null,
        adminId: null,
      });
      expect(result).toEqual(updated);
    });

    it('deve propagar EntityNotFoundException quando formulário não existe', async () => {
      const updateDto: UpdateDailyCollectionDto = { quantity: 1 } as any;
      const error = new EntityNotFoundException('Formulário não encontrado.');

      mockService.update.mockRejectedValue(error);

      await expect(controller.update(999, updateDto, 1, UserRole.ADMIN, null, null)).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover formulário com sucesso', async () => {
      const deleted = createDailyCollection({ id: 1 });
      mockService.remove.mockResolvedValue(deleted);

      const result = await controller.remove(1, 1, UserRole.ADMIN, null, null);

      expect(service.remove).toHaveBeenCalledWith(1, {
        id: 1,
        role: UserRole.ADMIN,
        associationId: null,
        adminId: null,
      });
      expect(result).toEqual(deleted);
    });

    it('deve propagar EntityNotFoundException', async () => {
      const error = new EntityNotFoundException('Formulário não encontrado.');
      mockService.remove.mockRejectedValue(error);

      await expect(controller.remove(999, 1, UserRole.ADMIN, null, null)).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('findAllByUserId', () => {
    const lists = (requester: any, userId: number, scope: object) => async () => {
      const items: any[] = [{ id: 1, userId }];
      mockService.findAll.mockResolvedValue(items);
      mockService.assertCanReadUserData.mockResolvedValue(undefined);

      const result = await controller.findAllByUserId(userId, requester);

      expect(service.assertCanReadUserData).toHaveBeenCalledWith(userId, requester);
      expect(service.findAll).toHaveBeenCalledWith({ scope, limit: MAX_LIMIT });
      expect(result).toEqual(items);
    };

    it('admin sem associação: o próprio grupo (não as coletas de todos os donos)', lists(adminA, 1, { adminGroupId: 1 }));
    it('admin de uma associação: as coletas da associação', lists({ ...adminA, associationId: 10 }, 1, { associationId: 10 }));
    it('vaqueiro cadastrado por um admin: o grupo desse admin',
      lists({ id: 5, userType: 'user', role: UserRole.VAQUEIRO, associationId: null, adminId: 1 }, 5, { adminGroupId: 1 }));
    it('vaqueiro sem vínculo: só as próprias',
      lists({ id: 5, userType: 'user', role: UserRole.VAQUEIRO, associationId: null, adminId: null }, 5, { userId: 5 }));

    it('recusa quando o id do caminho é de outro dono (nada é listado)', async () => {
      mockService.assertCanReadUserData.mockRejectedValue(new ForbiddenException('outro dono'));

      await expect(controller.findAllByUserId(99, adminA)).rejects.toThrow(ForbiddenException);
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findByAnimalId', () => {
    it('retorna o histórico do animal, checando o escopo de quem pede', async () => {
      const history = [{ collectionId: 1, collectionDate: new Date('2025-01-01'), quantity: 10, cmtResult: null }];
      mockService.findHistoryByAnimal.mockResolvedValue(history);

      const result = await controller.findByAnimalId(5, adminA);

      expect(service.findHistoryByAnimal).toHaveBeenCalledWith(5, adminA);
      expect(result).toEqual(history);
    });

    it('propaga ForbiddenException quando o animal é de outro dono', async () => {
      mockService.findHistoryByAnimal.mockRejectedValue(new ForbiddenException('outro dono'));

      await expect(controller.findByAnimalId(5, adminA)).rejects.toThrow(ForbiddenException);
    });
  });
});

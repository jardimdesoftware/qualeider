import { Test, TestingModule } from '@nestjs/testing';
import { AnimalsController } from '@/presentation/controllers/animals.controller';
import { AnimalsService } from '@/application/services/animals/animals.service';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { createAnimal } from '../../../factories/animal.factory';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BusinessException } from '@/common/exceptions/business.exception';
import { UserRole } from '@/domain/enums/enums';
import { MAX_LIMIT } from '@/domain/common/pagination.interface';
import { ForbiddenException } from '@nestjs/common';

describe('AnimalsController', () => {
  let controller: AnimalsController;
  let animalsService: AnimalsService;

  const mockAnimalsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    assertCanReadUserData: jest.fn(),
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

      const result = await controller.create(createDto, 1, UserRole.ADMIN, null, null);

      expect(animalsService.create).toHaveBeenCalledWith(createDto, {
        id: 1,
        role: UserRole.ADMIN,
        associationId: null,
        adminId: null,
      });
      expect(result).toEqual(created);
    });

    it('deve propagar EntityNotFoundException se o service lançar', async () => {
      const createDto: CreateAnimalDto = { userId: 999 } as any;
      const error = new EntityNotFoundException('Usuário não encontrado.');
      
      mockAnimalsService.create.mockRejectedValue(error);

      await expect(
        controller.create(createDto, 1, UserRole.ADMIN, null, null),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('deve propagar BusinessException se o service lançar', async () => {
        const createDto: CreateAnimalDto = { userId: 1 } as any;
        const error = new BusinessException('Regra de negócio violada.');
        
        mockAnimalsService.create.mockRejectedValue(error);
  
        await expect(
          controller.create(createDto, 1, UserRole.ADMIN, null, null),
        ).rejects.toThrow(BusinessException);
    });
  });

  const adminA = { id: 1, userType: 'user', role: UserRole.ADMIN, associationId: null, adminId: null };

  describe('findAll', () => {
    it('lista sempre dentro do escopo de quem pede (admin sem associação: o próprio grupo)', async () => {
      const animals = [createAnimal({ id: 1 }), createAnimal({ id: 2 })];
      mockAnimalsService.findAll.mockResolvedValue(animals);

      const result = await controller.findAll({}, adminA);

      expect(animalsService.findAll).toHaveBeenCalledWith({ scope: { adminGroupId: 1 } });
      expect(result).toEqual(animals);
    });

    it('os filtros da query são somados ao escopo, nunca o substituem', async () => {
      mockAnimalsService.findAll.mockResolvedValue([]);

      await controller.findAll({ associationId: 10, userId: 5, status: 'Active' }, adminA);

      expect(animalsService.findAll).toHaveBeenCalledWith({
        scope: { adminGroupId: 1 },
        associationId: 10,
        userId: 5,
        status: 'Active',
      });
    });

    it('login de associação lê o escopo da própria associação', async () => {
      mockAnimalsService.findAll.mockResolvedValue([]);

      await controller.findAll({}, { id: 7, userType: 'association' });

      expect(animalsService.findAll).toHaveBeenCalledWith({ scope: { associationId: 7 } });
    });
  });

  describe('findOne', () => {
    it('retorna o animal, checando o escopo de quem pede', async () => {
      const animal = createAnimal({ id: 1 });
      mockAnimalsService.findOne.mockResolvedValue(animal);

      const result = await controller.findOne(1, adminA);

      expect(animalsService.findOne).toHaveBeenCalledWith(1, adminA);
      expect(result).toEqual(animal);
    });

    it('propaga EntityNotFoundException quando o animal não existe', async () => {
      mockAnimalsService.findOne.mockRejectedValue(new EntityNotFoundException('Animal não encontrado.'));

      await expect(controller.findOne(999, adminA)).rejects.toThrow(EntityNotFoundException);
    });

    it('propaga ForbiddenException quando o animal é de outro dono', async () => {
      mockAnimalsService.findOne.mockRejectedValue(new ForbiddenException('outro dono'));

      await expect(controller.findOne(5, adminA)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('deve atualizar animal com sucesso e retornar o resultado direto', async () => {
      const updateDto: UpdateAnimalDto = { name: 'Bessie Updated' } as UpdateAnimalDto;
      const updated = createAnimal({ id: 1, ...updateDto });
      
      mockAnimalsService.update.mockResolvedValue(updated);

      const result = await controller.update(1, updateDto, 1, UserRole.ADMIN, null, null);

      expect(animalsService.update).toHaveBeenCalledWith(1, updateDto, {
        id: 1,
        role: UserRole.ADMIN,
        associationId: null,
        adminId: null,
      });
      expect(result).toEqual(updated);
    });

    it('deve propagar erro genérico do service', async () => {
      const updateDto: UpdateAnimalDto = { name: 'New' } as UpdateAnimalDto;
      const error = new Error('Database failure');
      
      mockAnimalsService.update.mockRejectedValue(error);

      await expect(
        controller.update(1, updateDto, 1, UserRole.ADMIN, null, null),
      ).rejects.toThrow('Database failure');
    });
  });

  describe('remove', () => {
    it('deve remover animal com sucesso', async () => {
      const response = { id: 1, status: 'Inactive' };
      mockAnimalsService.remove.mockResolvedValue(response);

      const result = await controller.remove(1, 1, UserRole.ADMIN, null, null);

      expect(animalsService.remove).toHaveBeenCalledWith(1, {
        id: 1,
        role: UserRole.ADMIN,
        associationId: null,
        adminId: null,
      });
      expect(result).toEqual(response);
    });

    it('deve propagar EntityNotFoundException', async () => {
      const error = new EntityNotFoundException('Animal não encontrado.');
      mockAnimalsService.remove.mockRejectedValue(error);

      await expect(
        controller.remove(999, 1, UserRole.ADMIN, null, null),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('inativar', () => {
    it('deve inativar animal passando o perfil do solicitante para o service', async () => {
      const response = { id: 1, status: 'Inactive' };
      mockAnimalsService.inativar.mockResolvedValue(response);

      const result = await controller.inativar(1, 1, UserRole.ADMIN, null, null);

      expect(animalsService.inativar).toHaveBeenCalledWith(1, {
        id: 1,
        role: UserRole.ADMIN,
        associationId: null,
        adminId: null,
      });
      expect(result).toEqual(response);
    });

    it('deve propagar ForbiddenException quando um VAQUEIRO tenta inativar uma vaca', async () => {
      const error = new ForbiddenException('Você não tem permissão para inativar animais.');
      mockAnimalsService.inativar.mockRejectedValue(error);

      await expect(
        controller.inativar(1, 5, UserRole.VAQUEIRO, null, 1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByUserId', () => {
    const lists = (requester: any, userId: number, scope: object) => async () => {
      const animals = [createAnimal({ id: 1 })];
      mockAnimalsService.findAll.mockResolvedValue(animals);
      mockAnimalsService.assertCanReadUserData.mockResolvedValue(undefined);

      const result = await controller.findAllByUserId(userId, requester);

      expect(animalsService.assertCanReadUserData).toHaveBeenCalledWith(userId, requester);
      expect(animalsService.findAll).toHaveBeenCalledWith({ scope, limit: MAX_LIMIT, includeInactive: true });
      expect(result).toEqual(animals);
    };

    it('admin sem associação: o próprio grupo (não os animais de todos os donos)',
      lists(adminA, 1, { adminGroupId: 1 }));

    it('admin de uma associação: o rebanho da associação',
      lists({ ...adminA, associationId: 10 }, 1, { associationId: 10 }));

    it('vaqueiro de uma associação: o rebanho da associação',
      lists({ id: 5, userType: 'user', role: UserRole.VAQUEIRO, associationId: 10, adminId: null }, 5, { associationId: 10 }));

    it('vaqueiro cadastrado por um admin: o grupo desse admin',
      lists({ id: 5, userType: 'user', role: UserRole.VAQUEIRO, associationId: null, adminId: 1 }, 5, { adminGroupId: 1 }));

    it('vaqueiro sem vínculo: só os próprios animais',
      lists({ id: 5, userType: 'user', role: UserRole.VAQUEIRO, associationId: null, adminId: null }, 5, { userId: 5 }));

    it('recusa quando o id do caminho é de outro dono (nada é listado)', async () => {
      mockAnimalsService.assertCanReadUserData.mockRejectedValue(new ForbiddenException('outro dono'));

      await expect(controller.findAllByUserId(99, adminA)).rejects.toThrow(ForbiddenException);
      expect(animalsService.findAll).not.toHaveBeenCalled();
    });
  });
});

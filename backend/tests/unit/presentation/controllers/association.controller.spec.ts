import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AssociationsController } from '@/presentation/controllers/associations.controller';
import { AssociationsService } from '@/application/services/associations/associations.service';
import { CreateAssociationDto } from '@/application/dtos/associations/create-association.dto';
import { BusinessException } from '@/common/exceptions/business.exception';
import { createAssociation } from '../../../factories/association.factory';

describe('AssociationsController', () => {
  let controller: AssociationsController;
  let associationsService: AssociationsService;

  const mockAssociationsService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findByCnpj: jest.fn(),
    findAssociates: jest.fn(),
    getAvailableProducers: jest.fn(),
    linkProducer: jest.fn(),
    getHerdStats: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockAssociation = createAssociation();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssociationsController],
      providers: [
        {
          provide: AssociationsService,
          useValue: mockAssociationsService,
        },
      ],
    }).compile();

    controller = module.get<AssociationsController>(AssociationsController);
    associationsService = module.get<AssociationsService>(AssociationsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar associação e retornar resposta padronizada', async () => {
      const createDto: CreateAssociationDto = {
        name: 'Nova Associação',
        cnpj: '12345678000190',
        email: 'nova@teste.com',
        password: '123',
        city: 'City',
        street: 'Rua do Leite',
        number: '100',
        neighborhood: 'Centro',
        zipCode: '12345000',
        presidentName: 'Pres',
        tradeName: 'Trade',
      } as CreateAssociationDto;

      mockAssociationsService.create.mockResolvedValue(mockAssociation);

      const result = await controller.create(createDto);

      expect(associationsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Associação criada com sucesso',
        data: mockAssociation,
      });
    });

    it('deve propagar BusinessException se o service falhar (ex: duplicidade)', async () => {
      const createDto: CreateAssociationDto = {
        email: 'exists@test.com',
      } as any;
      const error = new BusinessException('Email já cadastrado.');

      mockAssociationsService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(
        BusinessException,
      );
      await expect(controller.create(createDto)).rejects.toThrow(
        'Email já cadastrado.',
      );
    });
  });

  describe('checkEmail', () => {
    it('deve retornar { exists: true } se email for encontrado', async () => {
      mockAssociationsService.findByEmail.mockResolvedValue(mockAssociation);

      const result = await controller.checkEmail('existente@teste.com');

      expect(associationsService.findByEmail).toHaveBeenCalledWith(
        'existente@teste.com',
      );
      expect(result).toEqual({ exists: true });
    });

    it('deve retornar { exists: false } se email não for encontrado', async () => {
      mockAssociationsService.findByEmail.mockResolvedValue(null);

      const result = await controller.checkEmail('novo@teste.com');

      expect(result).toEqual({ exists: false });
    });

    it('deve lançar BusinessException se email não for fornecido', async () => {
      await expect(controller.checkEmail('')).rejects.toThrow(
        BusinessException,
      );
      await expect(controller.checkEmail('')).rejects.toThrow(
        'Email é obrigatório',
      );
    });
  });

  describe('checkCnpj', () => {
    it('deve retornar { exists: true } se CNPJ for encontrado', async () => {
      mockAssociationsService.findByCnpj.mockResolvedValue(mockAssociation);

      const result = await controller.checkCnpj('12345678000190');

      expect(associationsService.findByCnpj).toHaveBeenCalledWith(
        '12345678000190',
      );
      expect(result).toEqual({ exists: true });
    });

    it('deve retornar { exists: false } se CNPJ não for encontrado', async () => {
      mockAssociationsService.findByCnpj.mockResolvedValue(null);

      const result = await controller.checkCnpj('00000000000000');

      expect(result).toEqual({ exists: false });
    });

    it('deve lançar BusinessException se CNPJ não for fornecido', async () => {
      await expect(controller.checkCnpj('')).rejects.toThrow(BusinessException);
      await expect(controller.checkCnpj('')).rejects.toThrow(
        'CNPJ é obrigatório',
      );
    });
  });
  describe('getAssociates', () => {
    it('deve retornar lista de associados', async () => {
      const mockResult = { data: [] as any[], total: 0 };
      mockAssociationsService.findAssociates.mockResolvedValue(mockResult);
      const associationId = 1;

      const result = await controller.getAssociates(associationId, 1, 10);

      expect(associationsService.findAssociates).toHaveBeenCalledWith(1, { page: 1, limit: 10 });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getAvailableProducers', () => {
    it('deve retornar produtores disponíveis', async () => {
      const mockResult: any[] = [];
      mockAssociationsService.getAvailableProducers.mockResolvedValue(mockResult);

      const result = await controller.getAvailableProducers();

      expect(associationsService.getAvailableProducers).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('inviteProducer', () => {
    it('deve convidar produtor', async () => {
      const mockBody = { userId: 2 };
      const associationId = 1;
      mockAssociationsService.linkProducer.mockResolvedValue(undefined);

      const result = await controller.inviteProducer(mockBody, associationId);

      expect(associationsService.linkProducer).toHaveBeenCalledWith(2, 1);
      expect(result).toEqual({ message: 'Produtor vinculado com sucesso.' });
    });
  });

  describe('getHerdStats', () => {
    it('deve retornar estatísticas do rebanho', async () => {
      const mockStats = {};
      const associationId = 1;
      mockAssociationsService.getHerdStats.mockResolvedValue(mockStats);

      const result = await controller.getHerdStats(associationId);

      expect(associationsService.getHerdStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStats);
    });
  });

  describe('findById', () => {
    it('deve retornar associação por ID', async () => {
      mockAssociationsService.findById.mockResolvedValue(mockAssociation);

      const result = await controller.findById('1');

      expect(associationsService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAssociation);
    });

    it('deve lançar NotFoundException se não encontrar', async () => {
      mockAssociationsService.findById.mockResolvedValue(null);

      try {
        await controller.findById('1');
      } catch (e) {
        expect(e.response.statusCode).toBe(404);
        expect(e.message).toBe('Associação não encontrada');
      }
    });
  });

  describe('update', () => {
    it('deve atualizar associação', async () => {
      const mockBody = { name: 'New Name' };
      mockAssociationsService.update.mockResolvedValue(mockAssociation);

      const result = await controller.update('1', mockBody);

      expect(associationsService.update).toHaveBeenCalledWith(1, mockBody);
      expect(result).toEqual(mockAssociation);
    });
  });
});

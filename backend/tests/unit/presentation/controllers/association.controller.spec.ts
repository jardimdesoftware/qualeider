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
});

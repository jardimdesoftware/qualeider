import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsService } from '@/application/services/associations/associations.service';
import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { createAssociation } from '../../../factories/association.factory';
import { IHashService as IHashServiceSymbol, type IHashService } from '@/application/ports/hash.service';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { BusinessException } from '@/common/exceptions/business.exception';

describe('AssociationsService', () => {
  let service: AssociationsService;
  let associationRepository: jest.Mocked<IAssociationRepository>;
  let hashService: jest.Mocked<IHashService>;

  beforeEach(async () => {
    const mockRepository = {
      findByEmail: jest.fn(),
      findByCnpj: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssociationsService,
        {
          provide: IAssociationRepository,
          useValue: mockRepository,
        },
        {
          provide: IHashServiceSymbol,
          useValue: {
            hash: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AssociationsService>(AssociationsService);
    associationRepository = module.get<IAssociationRepository>(IAssociationRepository) as any;
    hashService = module.get<IHashService>(IHashServiceSymbol) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('deve buscar associação por email', async () => {
      const mockAssociation = createAssociation({
        id: 1,
        email: 'test@example.com',
      });
      associationRepository.findByEmail.mockResolvedValue(mockAssociation as any);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockAssociation);
      expect(associationRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('deve converter email para lowercase na busca', async () => {
      const mockAssociation = createAssociation({ email: 'test@example.com' });
      associationRepository.findByEmail.mockResolvedValue(mockAssociation as any);

      await service.findByEmail('TEST@EXAMPLE.COM');

      expect(associationRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('deve retornar null se não encontrar', async () => {
      associationRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('deve retornar null se email for undefined', async () => {
      const result = await service.findByEmail(undefined as any);

      expect(result).toBeNull();
      expect(associationRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('deve retornar null se email for null', async () => {
      const result = await service.findByEmail(null as any);

      expect(result).toBeNull();
      expect(associationRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('deve retornar null se email for string vazia', async () => {
      const result = await service.findByEmail('');

      expect(result).toBeNull();
      expect(associationRepository.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('findByCnpj', () => {
    it('deve buscar associação por CNPJ', async () => {
      const mockAssociation = createAssociation({
        id: 1,
        cnpj: '12345678000190',
      });
      associationRepository.findByCnpj.mockResolvedValue(mockAssociation as any);

      const result = await service.findByCnpj('12345678000190');

      expect(result).toEqual(mockAssociation);
      expect(associationRepository.findByCnpj).toHaveBeenCalledWith('12345678000190');
    });

    it('deve retornar null se não encontrar', async () => {
      associationRepository.findByCnpj.mockResolvedValue(null);

      const result = await service.findByCnpj('00000000000000');

      expect(result).toBeNull();
    });

    it('deve retornar null se CNPJ for undefined', async () => {
      const result = await service.findByCnpj(undefined as any);

      expect(result).toBeNull();
      expect(associationRepository.findByCnpj).not.toHaveBeenCalled();
    });

    it('deve retornar null se CNPJ for null', async () => {
      const result = await service.findByCnpj(null as any);

      expect(result).toBeNull();
      expect(associationRepository.findByCnpj).not.toHaveBeenCalled();
    });

    it('deve retornar null se CNPJ for string vazia', async () => {
      const result = await service.findByCnpj('');

      expect(result).toBeNull();
      expect(associationRepository.findByCnpj).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'Associação Teste',
      tradeName: 'ATEST',
      cnpj: '12345678000190',
      email: 'nova@example.com',
      password: 'Senha@123',
      city: 'Recife',
      state: 'PE',
      foundationDate: '2020-01-01',
    };

    beforeEach(() => {
      (hashService.hash as jest.Mock).mockResolvedValue('$2a$10$hashedPassword');
    });

    it('deve criar associação com sucesso', async () => {
      associationRepository.findByEmail.mockResolvedValue(null); // email não existe
      associationRepository.findByCnpj.mockResolvedValue(null); // cnpj não existe

      const mockCreatedAssociation = createAssociation({
        id: 1,
        name: createDto.name,
        email: createDto.email,
        cnpj: createDto.cnpj,
      });
      associationRepository.create.mockResolvedValue(
        mockCreatedAssociation as any,
      );

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', createDto.name);
      expect(hashService.hash).toHaveBeenCalledWith(
        createDto.password,
        BCRYPT_ROUNDS_USER_CREATION,
      );
      expect(associationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createDto.email,
          cnpj: createDto.cnpj,
          password: '$2a$10$hashedPassword',
          foundationDate: expect.any(Date),
        }),
      );
    });

    it('deve lançar ConflictException se email já existe', async () => {
      const existingAssociation = createAssociation({ email: createDto.email });
      associationRepository.findByEmail.mockResolvedValue(
        existingAssociation as any,
      );

      await expect(service.create(createDto as any)).rejects.toThrow(
        new BusinessException('Email já cadastrado.'),
      );

      expect(associationRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException se CNPJ já existe', async () => {
      associationRepository.findByEmail.mockResolvedValue(null); // email não existe
      const existingAssociation = createAssociation({ cnpj: createDto.cnpj });
      associationRepository.findByCnpj.mockResolvedValue(
        existingAssociation as any,
      ); // cnpj existe

      await expect(service.create(createDto as any)).rejects.toThrow(
        new BusinessException('CNPJ já cadastrado.'),
      );

      expect(associationRepository.create).not.toHaveBeenCalled();
    });

    it('deve criar associação com foundationDate null se não fornecido', async () => {
      associationRepository.findByEmail.mockResolvedValue(null);
      associationRepository.findByCnpj.mockResolvedValue(null);

      const dtoWithoutDate = { ...createDto };
      delete (dtoWithoutDate as any).foundationDate;

      const mockCreatedAssociation = createAssociation({
        foundationDate: null,
      });
      associationRepository.create.mockResolvedValue(
        mockCreatedAssociation as any,
      );

      await service.create(dtoWithoutDate as any);

      expect(associationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          foundationDate: null,
        }),
      );
    });

    it('deve hashear a senha antes de salvar', async () => {
      associationRepository.findByEmail.mockResolvedValue(null);
      associationRepository.findByCnpj.mockResolvedValue(null);
      associationRepository.create.mockResolvedValue(createAssociation() as any);

      await service.create(createDto as any);

      expect(hashService.hash).toHaveBeenCalledWith(
        createDto.password,
        BCRYPT_ROUNDS_USER_CREATION,
      );
      expect(associationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: '$2a$10$hashedPassword',
        }),
      );
    });

    it('não deve retornar a senha no resultado', async () => {
      associationRepository.findByEmail.mockResolvedValue(null);
      associationRepository.findByCnpj.mockResolvedValue(null);

      const mockCreatedAssociation = createAssociation();
      delete (mockCreatedAssociation as any).password;
      associationRepository.create.mockResolvedValue(
        mockCreatedAssociation as any,
      );

      const result = await service.create(createDto as any);

      expect(result).not.toHaveProperty('password');
    });
  });
});

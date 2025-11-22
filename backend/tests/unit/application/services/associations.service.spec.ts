import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsService } from '@/application/services/associations/associations.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { createAssociation } from '../../../factories/association.factory';
import { IHashService as IHashServiceSymbol, type IHashService } from '@/application/ports/hash.service';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { BusinessException } from '@/common/exceptions/business.exception';

describe('AssociationsService', () => {
  let service: AssociationsService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let hashService: jest.Mocked<IHashService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssociationsService,
        {
          provide: PrismaService,
          useValue: prisma,
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
      prisma.association.findUnique.mockResolvedValue(mockAssociation as any);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockAssociation);
      expect(prisma.association.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('deve converter email para lowercase na busca', async () => {
      const mockAssociation = createAssociation({ email: 'test@example.com' });
      prisma.association.findUnique.mockResolvedValue(mockAssociation as any);

      await service.findByEmail('TEST@EXAMPLE.COM');

      expect(prisma.association.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('deve retornar null se não encontrar', async () => {
      prisma.association.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('deve retornar null se email for undefined', async () => {
      const result = await service.findByEmail(undefined as any);

      expect(result).toBeNull();
      expect(prisma.association.findUnique).not.toHaveBeenCalled();
    });

    it('deve retornar null se email for null', async () => {
      const result = await service.findByEmail(null as any);

      expect(result).toBeNull();
      expect(prisma.association.findUnique).not.toHaveBeenCalled();
    });

    it('deve retornar null se email for string vazia', async () => {
      const result = await service.findByEmail('');

      expect(result).toBeNull();
      expect(prisma.association.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('findByCnpj', () => {
    it('deve buscar associação por CNPJ', async () => {
      const mockAssociation = createAssociation({
        id: 1,
        cnpj: '12345678000190',
      });
      prisma.association.findUnique.mockResolvedValue(mockAssociation as any);

      const result = await service.findByCnpj('12345678000190');

      expect(result).toEqual(mockAssociation);
      expect(prisma.association.findUnique).toHaveBeenCalledWith({
        where: { cnpj: '12345678000190' },
      });
    });

    it('deve retornar null se não encontrar', async () => {
      prisma.association.findUnique.mockResolvedValue(null);

      const result = await service.findByCnpj('00000000000000');

      expect(result).toBeNull();
    });

    it('deve retornar null se CNPJ for undefined', async () => {
      const result = await service.findByCnpj(undefined as any);

      expect(result).toBeNull();
      expect(prisma.association.findUnique).not.toHaveBeenCalled();
    });

    it('deve retornar null se CNPJ for null', async () => {
      const result = await service.findByCnpj(null as any);

      expect(result).toBeNull();
      expect(prisma.association.findUnique).not.toHaveBeenCalled();
    });

    it('deve retornar null se CNPJ for string vazia', async () => {
      const result = await service.findByCnpj('');

      expect(result).toBeNull();
      expect(prisma.association.findUnique).not.toHaveBeenCalled();
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
      prisma.association.findUnique.mockResolvedValue(null); // email não existe
      prisma.association.findUnique.mockResolvedValueOnce(null); // cnpj não existe

      const mockCreatedAssociation = createAssociation({
        id: 1,
        name: createDto.name,
        email: createDto.email,
        cnpj: createDto.cnpj,
      });
      prisma.association.create.mockResolvedValue(
        mockCreatedAssociation as any,
      );

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', createDto.name);
      expect(hashService.hash).toHaveBeenCalledWith(
        createDto.password,
        BCRYPT_ROUNDS_USER_CREATION,
      );
      expect(prisma.association.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: createDto.email,
          cnpj: createDto.cnpj,
          password: '$2a$10$hashedPassword',
          foundationDate: expect.any(Date),
        }),
        select: expect.any(Object),
      });
    });

    it('deve lançar ConflictException se email já existe', async () => {
      const existingAssociation = createAssociation({ email: createDto.email });
      prisma.association.findUnique.mockResolvedValueOnce(
        existingAssociation as any,
      );

      await expect(service.create(createDto as any)).rejects.toThrow(
        new BusinessException('Email já cadastrado.'),
      );

      expect(prisma.association.create).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException se CNPJ já existe', async () => {
      prisma.association.findUnique.mockResolvedValueOnce(null); // email não existe
      const existingAssociation = createAssociation({ cnpj: createDto.cnpj });
      prisma.association.findUnique.mockResolvedValueOnce(
        existingAssociation as any,
      ); // cnpj existe

      await expect(service.create(createDto as any)).rejects.toThrow(
        new BusinessException('CNPJ já cadastrado.'),
      );

      expect(prisma.association.create).not.toHaveBeenCalled();
    });

    it('deve criar associação com foundationDate null se não fornecido', async () => {
      prisma.association.findUnique.mockResolvedValue(null);

      const dtoWithoutDate = { ...createDto };
      delete (dtoWithoutDate as any).foundationDate;

      const mockCreatedAssociation = createAssociation({
        foundationDate: null,
      });
      prisma.association.create.mockResolvedValue(
        mockCreatedAssociation as any,
      );

      await service.create(dtoWithoutDate as any);

      expect(prisma.association.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          foundationDate: null,
        }),
        select: expect.any(Object),
      });
    });

    it('deve hashear a senha antes de salvar', async () => {
      prisma.association.findUnique.mockResolvedValue(null);
      prisma.association.create.mockResolvedValue(createAssociation() as any);

      await service.create(createDto as any);

      expect(hashService.hash).toHaveBeenCalledWith(
        createDto.password,
        BCRYPT_ROUNDS_USER_CREATION,
      );
      expect(prisma.association.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: '$2a$10$hashedPassword',
          }),
        }),
      );
    });

    it('não deve retornar a senha no resultado', async () => {
      prisma.association.findUnique.mockResolvedValue(null);

      const mockCreatedAssociation = createAssociation();
      delete (mockCreatedAssociation as any).password;
      prisma.association.create.mockResolvedValue(
        mockCreatedAssociation as any,
      );

      const result = await service.create(createDto as any);

      expect(result).not.toHaveProperty('password');
    });
  });
});

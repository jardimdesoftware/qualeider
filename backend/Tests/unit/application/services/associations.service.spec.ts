import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AssociationsService } from '@/application/services/associations/associations.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { createAssociation } from '../../../factories/association.factory';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AssociationsService', () => {
  let service: AssociationsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssociationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AssociationsService>(AssociationsService);
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
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$hashedPassword');
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
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
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
        new ConflictException('Email já cadastrado.'),
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
        new ConflictException('CNPJ já cadastrado.'),
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

      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
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

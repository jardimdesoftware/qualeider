import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AllowedEmailsService } from '@/application/services/allowed-emails/allowed-emails.service';
import { IAllowedEmailRepository } from '@/domain/repositories/allowed-email.repository';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

describe('AllowedEmailsService', () => {
  let service: AllowedEmailsService;
  let repository: jest.Mocked<IAllowedEmailRepository>;

  const entity = (over: Record<string, unknown> = {}) =>
    ({ id: 1, email: 'ext@gmail.com', adminId: 10, createdAt: new Date(), ...over }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllowedEmailsService,
        {
          provide: IAllowedEmailRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AllowedEmailsService);
    repository = module.get(IAllowedEmailRepository);
  });

  describe('findAll', () => {
    it('lista só as liberações do admin (e as antigas sem dono)', async () => {
      repository.findAll.mockResolvedValue([entity()]);

      await service.findAll(10);

      expect(repository.findAll).toHaveBeenCalledWith(10);
    });
  });

  describe('create', () => {
    it('registra o admin que liberou o email', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(entity());

      await service.create({ email: 'ext@gmail.com' }, 10);

      expect(repository.create).toHaveBeenCalledWith('ext@gmail.com', 10);
    });

    it('recusa emails @ifpe.edu.br (acesso automático)', async () => {
      await expect(service.create({ email: 'x@ifpe.edu.br' }, 10)).rejects.toThrow(
        BusinessException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('recusa email já liberado', async () => {
      repository.findByEmail.mockResolvedValue(entity());

      await expect(service.create({ email: 'ext@gmail.com' }, 10)).rejects.toThrow(
        'Este email já está liberado.',
      );
    });
  });

  describe('remove', () => {
    it('remove a liberação do próprio admin', async () => {
      repository.findById.mockResolvedValue(entity({ adminId: 10 }));

      await service.remove(1, 10);

      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('permite remover liberação antiga sem dono', async () => {
      repository.findById.mockResolvedValue(entity({ adminId: null }));

      await service.remove(1, 10);

      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('nega remover liberação de outro admin', async () => {
      repository.findById.mockResolvedValue(entity({ adminId: 99 }));

      await expect(service.remove(1, 10)).rejects.toThrow(ForbiddenException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('retorna não encontrado quando a liberação não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove(1, 10)).rejects.toThrow(EntityNotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { InvitesController } from '@/presentation/controllers/invites.controller';
import { InvitesService } from '@/application/services/invites/invites.service';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { RespondInviteDto } from '@/application/dtos/invites/respond-invite.dto';
import { InviteStatus, InviteAction } from '@/domain/enums/enums';
import { createInvite } from '../../../factories/invite.factory';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BusinessException } from '@/common/exceptions/business.exception';

describe('InvitesController', () => {
  let controller: InvitesController;
  let invitesService: InvitesService;

  const mockInvitesService = {
    createInvite: jest.fn(),
    getUserPendingInvites: jest.fn(),
    getAssociationInvites: jest.fn(),
    cancelInvite: jest.fn(),
    getInviteByToken: jest.fn(),
    respondToInvite: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitesController],
      providers: [
        {
          provide: InvitesService,
          useValue: mockInvitesService,
        },
      ],
    }).compile();

    controller = module.get<InvitesController>(InvitesController);
    invitesService = module.get<InvitesService>(InvitesService);

    jest.clearAllMocks();
  });

  describe('createInvite', () => {
    it('deve criar um convite com sucesso e retornar wrapper', async () => {
      const associationId = 1;
      const createDto: CreateInviteDto = { userId: 1 } as any;

      const createdInvite = {
        id: 1,
        token: 'abc123-def456',
        message: 'Convite enviado com sucesso',
        expiresAt: new Date(),
      };

      mockInvitesService.createInvite.mockResolvedValue(createdInvite);

      const result = await controller.createInvite(associationId, createDto);

      expect(invitesService.createInvite).toHaveBeenCalledWith(
        associationId,
        createDto,
      );
      expect(result).toEqual(createdInvite);
    });

    it('deve propagar EntityNotFoundException quando usuário não existe', async () => {
      const associationId = 1;
      const createDto: CreateInviteDto = { userId: 999 } as any;
      const error = new EntityNotFoundException('Usuário não encontrado.');
      
      mockInvitesService.createInvite.mockRejectedValue(error);

      await expect(
        controller.createInvite(associationId, createDto),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('deve propagar BusinessException quando convite pendente já existe', async () => {
      const associationId = 1;
      const createDto: CreateInviteDto = { userId: 1 } as any;
      const error = new BusinessException('Usuário já possui convite pendente.');
      
      mockInvitesService.createInvite.mockRejectedValue(error);

      await expect(
        controller.createInvite(associationId, createDto),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('getUserPendingInvites', () => {
    it('deve retornar lista de convites pendentes (sem wrapper)', async () => {
      const userId = 1;
      const pendingInvites = [
        createInvite({ userId, status: InviteStatus.PENDING }),
      ];

      mockInvitesService.getUserPendingInvites.mockResolvedValue(pendingInvites);

      const result = await controller.getUserPendingInvites(userId);

      expect(invitesService.getUserPendingInvites).toHaveBeenCalledWith(userId);
      expect(result).toEqual(pendingInvites);
    });
  });

  describe('getAssociationInvites', () => {
    it('deve retornar todos os convites da associação', async () => {
      const associationId = 1;
      const invites = [createInvite({ associationId })];

      mockInvitesService.getAssociationInvites.mockResolvedValue(invites);

      const result = await controller.getAssociationInvites(associationId);

      expect(invitesService.getAssociationInvites).toHaveBeenCalledWith(
        associationId,
        undefined,
      );
      expect(result).toEqual(invites);
    });

    it('deve filtrar convites por status', async () => {
      const associationId = 1;
      const status = InviteStatus.PENDING;
      const invites = [createInvite({ associationId, status })];

      mockInvitesService.getAssociationInvites.mockResolvedValue(invites);

      const result = await controller.getAssociationInvites(
        associationId,
        status,
      );

      expect(invitesService.getAssociationInvites).toHaveBeenCalledWith(
        associationId,
        status,
      );
      expect(result).toEqual(invites);
    });
  });

  describe('cancelInvite', () => {
    it('deve cancelar convite e retornar wrapper', async () => {
      const associationId = 1;
      const inviteId = 10;
      const serviceResponse = { message: 'Convite cancelado com sucesso' };

      mockInvitesService.cancelInvite.mockResolvedValue(serviceResponse);

      const result = await controller.cancelInvite(associationId, inviteId);

      expect(invitesService.cancelInvite).toHaveBeenCalledWith(
        associationId,
        inviteId,
      );
      expect(result).toEqual(serviceResponse);
    });

    it('deve propagar EntityNotFoundException quando convite não existe', async () => {
      const error = new EntityNotFoundException('Convite não encontrado.');
      mockInvitesService.cancelInvite.mockRejectedValue(error);

      await expect(controller.cancelInvite(1, 999)).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('getInviteByToken', () => {
    it('deve retornar dados do convite (sem wrapper)', async () => {
      const token = 'valid-token';
      const invite = createInvite({ token });

      mockInvitesService.getInviteByToken.mockResolvedValue(invite);

      const result = await controller.getInviteByToken(token);

      expect(invitesService.getInviteByToken).toHaveBeenCalledWith(token);
      expect(result).toEqual(invite);
    });

    it('deve propagar EntityNotFoundException quando token não existe', async () => {
      const error = new EntityNotFoundException('Convite não encontrado.');
      mockInvitesService.getInviteByToken.mockRejectedValue(error);

      await expect(controller.getInviteByToken('invalid')).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('respondToInvite', () => {
    it('deve aceitar convite e retornar wrapper', async () => {
      const token = 'valid-token';
      const dto: RespondInviteDto = { response: InviteAction.ACCEPT }; 
      const serviceResponse = {
        message: 'Você agora faz parte da Associação ABC!',
        associationId: 1,
        associationName: 'Associação ABC',
      };

      mockInvitesService.respondToInvite.mockResolvedValue(serviceResponse);

      const result = await controller.respondToInvite(token, dto);

      expect(invitesService.respondToInvite).toHaveBeenCalledWith(
        token,
        InviteAction.ACCEPT,
      );
      expect(result).toEqual(serviceResponse);
    });

    it('deve propagar BusinessException quando convite já foi respondido', async () => {
      const token = 'already-responded';
      const dto: RespondInviteDto = { response: InviteAction.ACCEPT };
      const error = new BusinessException('Convite já foi respondido.');
      
      mockInvitesService.respondToInvite.mockRejectedValue(error);

      await expect(controller.respondToInvite(token, dto)).rejects.toThrow(
        BusinessException,
      );
    });

    it('deve propagar BusinessException quando convite está expirado', async () => {
      const token = 'expired';
      const dto: RespondInviteDto = { response: InviteAction.ACCEPT };
      const error = new BusinessException('Convite expirado.');
      
      mockInvitesService.respondToInvite.mockRejectedValue(error);

      await expect(controller.respondToInvite(token, dto)).rejects.toThrow(
        BusinessException,
      );
    });
  });
});
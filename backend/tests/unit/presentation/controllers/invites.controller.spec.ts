import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { InvitesController } from '@/presentation/controllers/invites.controller';
import { InvitesService } from '@/application/services/invites/invites.service';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { RespondInviteDto } from '@/application/dtos/invites/respond-invite.dto';
import { InviteStatus } from '@/domain/enums/enums';
import { createInvite } from '../../../factories/invite.factory';

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
    it('deve criar um convite com sucesso', async () => {
      const associationId = 1;
      const createDto: CreateInviteDto = {
        userId: 1,
      } as any;

      const expectedResult = {
        id: 1,
        token: 'abc123-def456-ghi789',
        message: 'Convite enviado com sucesso',
        expiresAt: new Date('2025-11-10T10:30:00.000Z'),
      };

      mockInvitesService.createInvite.mockResolvedValue(expectedResult);

      const result = await controller.createInvite(associationId, createDto);

      expect(invitesService.createInvite).toHaveBeenCalledWith(
        associationId,
        createDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('deve propagar NotFoundException quando usuário não existe', async () => {
      const associationId = 1;
      const createDto: CreateInviteDto = {
        userId: 999,
      } as any;

      const notFoundError = new Error('Usuário não encontrado.');
      mockInvitesService.createInvite.mockRejectedValue(notFoundError);

      await expect(
        controller.createInvite(associationId, createDto),
      ).rejects.toThrow('Usuário não encontrado.');
    });

    it('deve propagar ConflictException quando convite pendente já existe', async () => {
      const associationId = 1;
      const createDto: CreateInviteDto = {
        userId: 1,
      } as any;

      const conflictError = new Error('Usuário já possui convite pendente.');
      mockInvitesService.createInvite.mockRejectedValue(conflictError);

      await expect(
        controller.createInvite(associationId, createDto),
      ).rejects.toThrow('Usuário já possui convite pendente.');
    });
  });

  describe('getUserPendingInvites', () => {
    it('deve retornar lista de convites pendentes do usuário', async () => {
      const userId = 1;
      const pendingInvites = [
        createInvite({ userId, status: InviteStatus.PENDING }),
        createInvite({ userId, status: InviteStatus.PENDING, id: 2 }),
      ];

      mockInvitesService.getUserPendingInvites.mockResolvedValue(
        pendingInvites,
      );

      const result = await controller.getUserPendingInvites(userId);

      expect(invitesService.getUserPendingInvites).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual(pendingInvites);
      expect(result).toHaveLength(2);
    });

    it('deve retornar lista vazia quando não há convites pendentes', async () => {
      const userId = 1;

      mockInvitesService.getUserPendingInvites.mockResolvedValue([]);

      const result = await controller.getUserPendingInvites(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getAssociationInvites', () => {
    it('deve retornar todos os convites da associação quando status não é fornecido', async () => {
      const associationId = 1;
      const invites = [
        createInvite({ associationId, status: InviteStatus.PENDING }),
        createInvite({
          associationId,
          status: InviteStatus.ACCEPTED,
          id: 2,
        }),
        createInvite({
          associationId,
          status: InviteStatus.DECLINED,
          id: 3,
        }),
      ];

      mockInvitesService.getAssociationInvites.mockResolvedValue(invites);

      const result = await controller.getAssociationInvites(associationId);

      expect(invitesService.getAssociationInvites).toHaveBeenCalledWith(
        associationId,
        undefined,
      );
      expect(result).toEqual(invites);
      expect(result).toHaveLength(3);
    });

    it('deve filtrar convites por status PENDING', async () => {
      const associationId = 1;
      const status = InviteStatus.PENDING;
      const pendingInvites = [
        createInvite({ associationId, status: InviteStatus.PENDING }),
        createInvite({ associationId, status: InviteStatus.PENDING, id: 2 }),
      ];

      mockInvitesService.getAssociationInvites.mockResolvedValue(
        pendingInvites,
      );

      const result = await controller.getAssociationInvites(
        associationId,
        status,
      );

      expect(invitesService.getAssociationInvites).toHaveBeenCalledWith(
        associationId,
        InviteStatus.PENDING,
      );
      expect(result).toEqual(pendingInvites);
    });

    it('deve filtrar convites por status ACCEPTED', async () => {
      const associationId = 1;
      const status = InviteStatus.ACCEPTED;
      const acceptedInvites = [
        createInvite({ associationId, status: InviteStatus.ACCEPTED }),
      ];

      mockInvitesService.getAssociationInvites.mockResolvedValue(
        acceptedInvites,
      );

      const result = await controller.getAssociationInvites(
        associationId,
        status,
      );

      expect(result).toEqual(acceptedInvites);
      expect(result[0].status).toBe(InviteStatus.ACCEPTED);
    });
  });

  describe('cancelInvite', () => {
    it('deve cancelar convite pendente com sucesso', async () => {
      const associationId = 1;
      const inviteId = 10;

      const expectedResult = {
        message: 'Convite cancelado com sucesso',
      };

      mockInvitesService.cancelInvite.mockResolvedValue(expectedResult);

      const result = await controller.cancelInvite(associationId, inviteId);

      expect(invitesService.cancelInvite).toHaveBeenCalledWith(
        associationId,
        inviteId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('deve propagar NotFoundException quando convite não existe', async () => {
      const associationId = 1;
      const inviteId = 999;

      const notFoundError = new Error('Convite não encontrado.');
      mockInvitesService.cancelInvite.mockRejectedValue(notFoundError);

      await expect(
        controller.cancelInvite(associationId, inviteId),
      ).rejects.toThrow('Convite não encontrado.');
    });

    it('deve propagar BadRequestException quando convite já foi respondido', async () => {
      const associationId = 1;
      const inviteId = 10;

      const badRequestError = new Error('Convite já foi respondido.');
      mockInvitesService.cancelInvite.mockRejectedValue(badRequestError);

      await expect(
        controller.cancelInvite(associationId, inviteId),
      ).rejects.toThrow('Convite já foi respondido.');
    });
  });

  describe('getInviteByToken', () => {
    it('deve retornar dados do convite quando token é válido', async () => {
      const token = 'valid-token-123';
      const invite = createInvite({ token, status: InviteStatus.PENDING });

      mockInvitesService.getInviteByToken.mockResolvedValue(invite);

      const result = await controller.getInviteByToken(token);

      expect(invitesService.getInviteByToken).toHaveBeenCalledWith(token);
      expect(result).toEqual(invite);
      expect((result as any).token).toBe(token);
    });

    it('deve propagar NotFoundException quando token não existe', async () => {
      const token = 'invalid-token';

      const notFoundError = new Error('Convite não encontrado.');
      mockInvitesService.getInviteByToken.mockRejectedValue(notFoundError);

      await expect(controller.getInviteByToken(token)).rejects.toThrow(
        'Convite não encontrado.',
      );
    });
  });

  describe('respondToInvite', () => {
    it('deve aceitar convite com sucesso', async () => {
      const token = 'valid-token-123';
      const respondDto: RespondInviteDto = {
        response: 'accept',
      } as any;

      const expectedResult = {
        message: 'Você agora faz parte da Associação ABC!',
        associationId: 1,
        associationName: 'Associação ABC',
      };

      mockInvitesService.respondToInvite.mockResolvedValue(expectedResult);

      const result = await controller.respondToInvite(token, respondDto);

      expect(invitesService.respondToInvite).toHaveBeenCalledWith(
        token,
        'accept',
      );
      expect(result).toEqual(expectedResult);
    });

    it('deve recusar convite com sucesso', async () => {
      const token = 'valid-token-123';
      const respondDto: RespondInviteDto = {
        response: 'decline',
      } as any;

      const expectedResult = {
        message: 'Convite recusado.',
      };

      mockInvitesService.respondToInvite.mockResolvedValue(expectedResult);

      const result = await controller.respondToInvite(token, respondDto);

      expect(invitesService.respondToInvite).toHaveBeenCalledWith(
        token,
        'decline',
      );
      expect(result).toEqual(expectedResult);
    });

    it('deve propagar NotFoundException quando token não existe', async () => {
      const token = 'invalid-token';
      const respondDto: RespondInviteDto = {
        response: 'accept',
      } as any;

      const notFoundError = new Error('Convite não encontrado.');
      mockInvitesService.respondToInvite.mockRejectedValue(notFoundError);

      await expect(
        controller.respondToInvite(token, respondDto),
      ).rejects.toThrow('Convite não encontrado.');
    });

    it('deve propagar BadRequestException quando convite já foi respondido', async () => {
      const token = 'already-responded';
      const respondDto: RespondInviteDto = {
        response: 'accept',
      } as any;

      const badRequestError = new Error('Convite já foi respondido.');
      mockInvitesService.respondToInvite.mockRejectedValue(badRequestError);

      await expect(
        controller.respondToInvite(token, respondDto),
      ).rejects.toThrow('Convite já foi respondido.');
    });

    it('deve propagar BadRequestException quando convite está expirado', async () => {
      const token = 'expired-token';
      const respondDto: RespondInviteDto = {
        response: 'accept',
      } as any;

      const badRequestError = new Error('Convite expirado.');
      mockInvitesService.respondToInvite.mockRejectedValue(badRequestError);

      await expect(
        controller.respondToInvite(token, respondDto),
      ).rejects.toThrow('Convite expirado.');
    });
  });
});

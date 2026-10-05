import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '@/presentation/controllers/notifications.controller';
import { NotificationsService } from '@/application/services/notifications/notifications.service';
import { SendNotificationDto } from '@/application/dtos/notifications/send-notification.dto';
import { NotificationEvent } from '@/events/notification.events';
import { NotificationType, UserRole } from '@/domain/enums/enums';
import { ForbiddenException } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    notifyProducers: jest.fn(),
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('deve enviar notificação individual e retornar wrapper', async () => {
      const dto: SendNotificationDto = {
        type: NotificationType.INDIVIDUAL, 
        associationId: 1,
        subject: 'Aviso',
        message: 'Olá',
        userIds: [1, 2],
        template: 'default',
      } as any;

      mockNotificationsService.notifyProducers.mockResolvedValue(undefined);

      const result = await controller.sendNotification(dto, 1, 'association', undefined as any, null);

      expect(service.notifyProducers).toHaveBeenCalledWith(
        expect.any(NotificationEvent),
      );
      expect(result).toEqual({ count: 2 });
    });

    it('deve enviar notificação geral e retornar count "todos"', async () => {
      const dto: SendNotificationDto = {
        type: NotificationType.COLLECTIVE,
        associationId: 1,
        subject: 'Aviso Geral',
        message: 'Olá a todos',
      } as any;

      mockNotificationsService.notifyProducers.mockResolvedValue(undefined);

      const result = await controller.sendNotification(dto, 1, 'association', undefined as any, null);

      expect(result).toEqual({ count: 'todos' });
    });

    it('deve propagar EntityNotFoundException', async () => {
      const dto: SendNotificationDto = { associationId: 1 } as any;
      const error = new EntityNotFoundException('Associação não encontrada');

      mockNotificationsService.notifyProducers.mockRejectedValue(error);

      await expect(controller.sendNotification(dto, 1, 'association', undefined as any, null)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('deve propagar BusinessException', async () => {
      const dto: SendNotificationDto = { type: NotificationType.INDIVIDUAL, associationId: 1, userIds: [] } as any;
      const error = new BusinessException('Lista de usuários vazia');

      mockNotificationsService.notifyProducers.mockRejectedValue(error);

      await expect(controller.sendNotification(dto, 1, 'association', undefined as any, null)).rejects.toThrow(
        BusinessException,
      );
    });
  });


  describe('autorização do envio', () => {
    const dto = {
      type: NotificationType.COLLECTIVE,
      associationId: 5,
      subject: 'Aviso',
      message: 'Mensagem de teste longa',
    } as SendNotificationDto;

    beforeEach(() => mockNotificationsService.notifyProducers.mockResolvedValue(undefined));

    it('a própria associação envia para os seus membros', async () => {
      await controller.sendNotification(dto, 5, 'association', undefined as any, null);

      expect(service.notifyProducers).toHaveBeenCalled();
    });

    it('um ADMIN membro da associação envia', async () => {
      await controller.sendNotification(dto, 10, 'user', UserRole.ADMIN, 5);

      expect(service.notifyProducers).toHaveBeenCalled();
    });

    it.each([
      ['usuário sem associação', 10, 'user', UserRole.ADMIN, null],
      ['ADMIN de OUTRA associação', 10, 'user', UserRole.ADMIN, 6],
      ['funcionário (VAQUEIRO) da própria associação', 10, 'user', UserRole.VAQUEIRO, 5],
      ['outra associação', 6, 'association', undefined, null],
      ['usuário cujo id coincide com o da associação', 5, 'user', UserRole.ADMIN, null],
    ])('nega: %s (nada é enviado)', async (_label, id, type, role, associationId) => {
      await expect(
        controller.sendNotification(dto, id as number, type as string, role as any, associationId as number | null),
      ).rejects.toThrow(ForbiddenException);
      expect(service.notifyProducers).not.toHaveBeenCalled();
    });
  });

  describe('getMyNotifications', () => {
    it('deve retornar notificações do usuário', async () => {
      const userId = 1;
      const mockNotifications: any[] = [];
      mockNotificationsService.getUserNotifications.mockResolvedValue(mockNotifications);

      const result = await controller.getMyNotifications(userId);

      expect(service.getUserNotifications).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida', async () => {
      mockNotificationsService.markAsRead.mockResolvedValue(undefined);

      const result = await controller.markAsRead(1, 42);

      expect(service.markAsRead).toHaveBeenCalledWith(1, 42);
      expect(result).toBeUndefined();
    });
  });
});
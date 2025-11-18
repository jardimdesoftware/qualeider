import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { NotificationsController } from '@/presentation/controllers/notifications.controller';
import { NotificationsService } from '@/application/services/notifications/notifications.service';
import { SendNotificationDto } from '@/application/dtos/notifications/send-notification.dto';
import { NotificationEvent } from '@/events/notification.events';
import { NotificationType } from '@/domain/enums/enums';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    notifyProducers: jest.fn(),
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

      const result = await controller.sendNotification(dto);

      expect(service.notifyProducers).toHaveBeenCalledWith(
        expect.any(NotificationEvent),
      );
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Notificação enviada com sucesso',
        data: { count: 2 },
      });
    });

    it('deve enviar notificação geral e retornar count "todos"', async () => {
      const dto: SendNotificationDto = {
        type: NotificationType.COLLECTIVE,
        associationId: 1,
        subject: 'Aviso Geral',
        message: 'Olá a todos',
      } as any;

      mockNotificationsService.notifyProducers.mockResolvedValue(undefined);

      const result = await controller.sendNotification(dto);

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Notificação enviada com sucesso',
        data: { count: 'todos' },
      });
    });

    it('deve propagar EntityNotFoundException', async () => {
      const dto: SendNotificationDto = { associationId: 999 } as any;
      const error = new EntityNotFoundException('Associação não encontrada');

      mockNotificationsService.notifyProducers.mockRejectedValue(error);

      await expect(controller.sendNotification(dto)).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('deve propagar BusinessException', async () => {
      const dto: SendNotificationDto = { type: NotificationType.INDIVIDUAL, userIds: [] } as any;
      const error = new BusinessException('Lista de usuários vazia');

      mockNotificationsService.notifyProducers.mockRejectedValue(error);

      await expect(controller.sendNotification(dto)).rejects.toThrow(
        BusinessException,
      );
    });
  });
});
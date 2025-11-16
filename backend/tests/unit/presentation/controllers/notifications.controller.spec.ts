import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '@/presentation/controllers/notifications.controller';
import { NotificationsService } from '@/application/services/notifications/notifications.service';
import { SendNotificationDto } from '@/application/dtos/notifications/send-notification.dto';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: NotificationsService;

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
    notificationsService =
      module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('deve enviar notificação individual para usuários específicos', async () => {
      const dto: SendNotificationDto = {
        type: 'individual',
        associationId: 1,
        userIds: [1, 2, 3],
        subject: 'Título da Notificação',
        message: 'Mensagem de teste para notificação individual',
      };

      mockNotificationsService.notifyProducers.mockResolvedValue(undefined);

      const result = await controller.sendNotification(dto);

      expect(notificationsService.notifyProducers).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'individual',
          associationId: 1,
          userIds: [1, 2, 3],
          subject: 'Título da Notificação',
          message: 'Mensagem de teste para notificação individual',
        }),
      );
      expect(result).toEqual({
        message: 'Notificação enviada com sucesso',
        count: 3,
      });
    });

    it('deve enviar notificação coletiva para todos os usuários', async () => {
      const dto: SendNotificationDto = {
        type: 'collective',
        associationId: 1,
        subject: 'Notificação Coletiva',
        message: 'Mensagem para todos os produtores da associação',
      };

      mockNotificationsService.notifyProducers.mockResolvedValue(undefined);

      const result = await controller.sendNotification(dto);

      expect(notificationsService.notifyProducers).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'collective',
          associationId: 1,
          subject: 'Notificação Coletiva',
          message: 'Mensagem para todos os produtores da associação',
        }),
      );
      expect(result).toEqual({
        message: 'Notificação enviada com sucesso',
        count: 'todos',
      });
    });

    it('deve incluir template quando fornecido', async () => {
      const dto: SendNotificationDto = {
        type: 'individual',
        associationId: 1,
        userIds: [5],
        subject: 'Assunto',
        message: 'Mensagem com template',
        template: 'custom-template',
      };

      mockNotificationsService.notifyProducers.mockResolvedValue(undefined);

      await controller.sendNotification(dto);

      expect(notificationsService.notifyProducers).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'custom-template',
        }),
      );
    });

    it('deve retornar count correto para notificação individual', async () => {
      const dto: SendNotificationDto = {
        type: 'individual',
        associationId: 1,
        userIds: [1, 2, 3, 4, 5],
        subject: 'Assunto',
        message: 'Mensagem teste',
      };

      mockNotificationsService.notifyProducers.mockResolvedValue(undefined);

      const result = await controller.sendNotification(dto);

      expect(result.count).toBe(5);
    });

    it('deve chamar notifyProducers com NotificationEvent correto', async () => {
      const dto: SendNotificationDto = {
        type: 'collective',
        associationId: 10,
        subject: 'Teste Subject',
        message: 'Teste Message',
      };

      mockNotificationsService.notifyProducers.mockResolvedValue(undefined);

      await controller.sendNotification(dto);

      expect(notificationsService.notifyProducers).toHaveBeenCalledTimes(1);
      const calledEvent =
        mockNotificationsService.notifyProducers.mock.calls[0][0];
      expect(calledEvent.type).toBe('collective');
      expect(calledEvent.associationId).toBe(10);
      expect(calledEvent.subject).toBe('Teste Subject');
      expect(calledEvent.message).toBe('Teste Message');
    });
  });
});

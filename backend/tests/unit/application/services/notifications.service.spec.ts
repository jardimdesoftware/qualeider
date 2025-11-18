import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '@/application/services/notifications/notifications.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createMockPrismaService } from '../../../mocks/prisma.mock';
import { createMockEventEmitter } from '../../../mocks/event-emitter.mock';
import { createUser } from '../../../factories/user.factory';
import { NotificationEvent } from '@/events/notification.events';
import { NotificationType } from '@/domain/enums/enums';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    eventEmitter = createMockEventEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyProducers', () => {
    it('deve notificar usuários individuais', async () => {
      const user1 = createUser({
        id: 1,
        email: 'user1@example.com',
        name: 'User 1',
      });
      const user2 = createUser({
        id: 2,
        email: 'user2@example.com',
        name: 'User 2',
      });

      const event: NotificationEvent = {
        type: NotificationType.INDIVIDUAL,
        associationId: 1,
        userIds: [1, 2],
        subject: 'Novo convite',
        message: 'Você recebeu um novo convite',
      };

      prisma.user.findMany.mockResolvedValue([user1, user2] as any);

      await service.notifyProducers(event);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [1, 2] },
          associationId: 1,
        },
      });

      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.send', {
        to: 'user1@example.com',
        subject: 'Novo convite',
        message: 'Você recebeu um novo convite',
        userName: 'User 1',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.send', {
        to: 'user2@example.com',
        subject: 'Novo convite',
        message: 'Você recebeu um novo convite',
        userName: 'User 2',
      });
    });

    it('deve notificar todos os usuários de uma associação', async () => {
      const user1 = createUser({
        id: 1,
        email: 'user1@example.com',
        name: 'User 1',
        associationId: 5,
      });
      const user2 = createUser({
        id: 2,
        email: 'user2@example.com',
        name: 'User 2',
        associationId: 5,
      });
      const user3 = createUser({
        id: 3,
        email: 'user3@example.com',
        name: 'User 3',
        associationId: 5,
      });

      const event: NotificationEvent = {
        type: NotificationType.COLLECTIVE,
        associationId: 5,
        subject: 'Comunicado Geral',
        message: 'Reunião amanhã às 10h',
      };

      prisma.user.findMany.mockResolvedValue([user1, user2, user3] as any);

      await service.notifyProducers(event);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { associationId: 5 },
      });

      expect(eventEmitter.emit).toHaveBeenCalledTimes(3);
    });

    it('não deve notificar se não houver usuários', async () => {
      const event: NotificationEvent = {
        type: NotificationType.INDIVIDUAL,
        associationId: 1,
        userIds: [999],
        subject: 'Teste',
        message: 'Teste',
      };

      prisma.user.findMany.mockResolvedValue([]);

      await service.notifyProducers(event);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('deve filtrar usuários por associationId em notificações individuais', async () => {
      const event: NotificationEvent = {
        type: NotificationType.INDIVIDUAL,
        associationId: 3,
        userIds: [1, 2, 3],
        subject: 'Teste',
        message: 'Mensagem de teste',
      };

      prisma.user.findMany.mockResolvedValue([]);

      await service.notifyProducers(event);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [1, 2, 3] },
          associationId: 3,
        },
      });
    });

    it('deve emitir evento com payload correto', async () => {
      const user = createUser({
        id: 10,
        email: 'joao@example.com',
        name: 'João Silva',
      });

      const event: NotificationEvent = {
        type: NotificationType.INDIVIDUAL,
        associationId: 1,
        userIds: [10],
        subject: 'Assunto Importante',
        message: 'Conteúdo da notificação',
      };

      prisma.user.findMany.mockResolvedValue([user] as any);

      await service.notifyProducers(event);

      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.send', {
        to: 'joao@example.com',
        subject: 'Assunto Importante',
        message: 'Conteúdo da notificação',
        userName: 'João Silva',
      });
    });
  });
});

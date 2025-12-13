import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '@/application/services/notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createMockEventEmitter } from '../../../mocks/event-emitter.mock';
import { createUser } from '../../../factories/user.factory';
import { NotificationEvent } from '@/events/notification.events';
import { NotificationType } from '@/domain/enums/enums';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let userRepository: jest.Mocked<IUserRepository>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(async () => {
    eventEmitter = createMockEventEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: IUserRepository,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            update: jest.fn(),
            partialUpdate: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn(),
            },
            notificationRecipient: {
              createMany: jest.fn(),
            },
            $transaction: jest.fn((cb) => cb({
               notification: { create: jest.fn() },
               notificationRecipient: { createMany: jest.fn() }
            })),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    userRepository = module.get(IUserRepository);
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

      userRepository.findAll.mockResolvedValue([user1, user2]);

      await service.notifyProducers(event);

      expect(userRepository.findAll).toHaveBeenCalledWith({
        ids: [1, 2],
        associationId: 1,
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

      userRepository.findAll.mockResolvedValue([user1, user2, user3]);

      await service.notifyProducers(event);

      expect(userRepository.findAll).toHaveBeenCalledWith({
        associationId: 5,
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

      userRepository.findAll.mockResolvedValue([]);

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

      userRepository.findAll.mockResolvedValue([]);

      await service.notifyProducers(event);

      expect(userRepository.findAll).toHaveBeenCalledWith({
        ids: [1, 2, 3],
        associationId: 3,
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

      userRepository.findAll.mockResolvedValue([user]);

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

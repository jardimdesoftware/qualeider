import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsTestController } from '@/presentation/controllers/notifications-test.controller';

describe('NotificationsTestController', () => {
  let controller: NotificationsTestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsTestController],
    }).compile();

    controller = module.get<NotificationsTestController>(
      NotificationsTestController,
    );
  });

  describe('ping', () => {
    it('deve retornar pong', () => {
      const result = controller.ping();

      expect(result).toEqual({
        message: 'pong',
      });
    });
  });
});

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SendNotificationDto } from '@/application/dtos/notifications/send-notification.dto';
import { NotificationType } from '@/domain/enums/enums'; // ✅ Importe o Enum

describe('SendNotificationDto', () => {
  // Helper para criar objeto base válido
  const createBaseDto = () => ({
    type: NotificationType.COLLECTIVE,
    associationId: 1,
    subject: 'Assunto Válido',
    message: 'Mensagem válida com mais de 10 caracteres',
  });

  describe('associationId validation', () => {
    it('deve aceitar associationId válido', async () => {
      const dto = plainToInstance(SendNotificationDto, createBaseDto());
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar associationId inválido (string)', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        ...createBaseDto(),
        associationId: 'abc',
      });
      const errors = await validate(dto);
      const idErrors = errors.find((e) => e.property === 'associationId');
      expect(idErrors).toBeDefined();
      expect(idErrors?.constraints).toHaveProperty('isInt'); // ✅ Agora é isInt
    });
  });

  describe('userIds validation', () => {
    it('deve aceitar userIds válido quando type individual', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        ...createBaseDto(),
        type: NotificationType.INDIVIDUAL,
        userIds: [1, 2],
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar userIds não numérico', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        ...createBaseDto(),
        type: NotificationType.INDIVIDUAL,
        userIds: ['a', 'b'],
      });
      const errors = await validate(dto);
      const userIdsErrors = errors.find((e) => e.property === 'userIds');
      expect(userIdsErrors).toBeDefined();
      // O validador de array com 'each: true' retorna erro para cada item inválido
      // ou um erro geral dependendo da implementação. O importante é que falhe.
      expect(userIdsErrors?.constraints).toHaveProperty('isInt'); 
    });
  });

  describe('type validation', () => {
    it('deve aceitar type "individual"', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        ...createBaseDto(),
        type: NotificationType.INDIVIDUAL,
        userIds: [1], // Necessário para não falhar na regra condicional se fosse obrigatório
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve aceitar type "collective"', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        ...createBaseDto(),
        type: NotificationType.COLLECTIVE,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar type inválido', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        ...createBaseDto(),
        type: 'INVALID_TYPE',
      });
      const errors = await validate(dto);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
      expect(typeError?.constraints).toHaveProperty('isEnum');
    });
  });

  describe('subject validation', () => {
    it('deve rejeitar subject curto', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        ...createBaseDto(),
        subject: 'Oi',
      });
      const errors = await validate(dto);
      const subjectError = errors.find((e) => e.property === 'subject');
      expect(subjectError).toBeDefined();
      expect(subjectError?.constraints).toHaveProperty('minLength');
    });
  });

  describe('message validation', () => {
    it('deve rejeitar message curta', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        ...createBaseDto(),
        message: 'Curto',
      });
      const errors = await validate(dto);
      const messageError = errors.find((e) => e.property === 'message');
      expect(messageError).toBeDefined();
      expect(messageError?.constraints).toHaveProperty('minLength');
    });
  });

  describe('template validation', () => {
    it('deve aceitar template opcional', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        ...createBaseDto(),
        template: 'my-template',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar template não string', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        ...createBaseDto(),
        template: 123,
      });
      const errors = await validate(dto);
      const templateError = errors.find((e) => e.property === 'template');
      expect(templateError).toBeDefined();
      expect(templateError?.constraints).toHaveProperty('isString');
    });
  });
});
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SendNotificationDto } from '@/application/dtos/notifications/send-notification.dto';

describe('SendNotificationDto', () => {
  describe('associationId validation', () => {
    it('deve aceitar associationId válido', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'individual',
        associationId: 1,
        userIds: [1],
        subject: 'Assunto',
        message: 'Mensagem válida',
      });
      const errors = await validate(dto);
      const idErrors = errors.filter((e) => e.property === 'associationId');
      expect(idErrors.length).toBe(0);
    });

    it('deve rejeitar associationId inválido', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'individual',
        associationId: 'abc',
        userIds: [1],
        subject: 'Assunto',
        message: 'Mensagem válida',
      });
      const errors = await validate(dto);
      const idErrors = errors.filter((e) => e.property === 'associationId');
      expect(idErrors.length).toBeGreaterThan(0);
    });
  });

  describe('userIds validation', () => {
    it('deve aceitar userIds válido quando type individual', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'individual',
        associationId: 1,
        userIds: [1, 2],
        subject: 'Assunto',
        message: 'Mensagem válida',
      });
      const errors = await validate(dto);
      const userIdsErrors = errors.filter((e) => e.property === 'userIds');
      expect(userIdsErrors.length).toBe(0);
    });

    it('deve rejeitar userIds não numérico', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'individual',
        associationId: 1,
        userIds: ['a', 'b'],
        subject: 'Assunto',
        message: 'Mensagem válida',
      });
      const errors = await validate(dto);
      const userIdsErrors = errors.filter((e) => e.property === 'userIds');
      expect(userIdsErrors.length).toBeGreaterThan(0);
    });
  });

  describe('subject validation', () => {
    it('deve aceitar subject válido', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Assunto válido',
        message: 'Mensagem válida',
      });
      const errors = await validate(dto);
      const subjectErrors = errors.filter((e) => e.property === 'subject');
      expect(subjectErrors.length).toBe(0);
    });

    it('deve rejeitar subject curto', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'A',
        message: 'Mensagem válida',
      });
      const errors = await validate(dto);
      const subjectErrors = errors.filter((e) => e.property === 'subject');
      expect(subjectErrors.length).toBeGreaterThan(0);
    });
  });

  describe('message validation', () => {
    it('deve aceitar message válido', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Assunto válido',
        message: 'Mensagem longa o suficiente',
      });
      const errors = await validate(dto);
      const messageErrors = errors.filter((e) => e.property === 'message');
      expect(messageErrors.length).toBe(0);
    });

    it('deve rejeitar message curto', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Assunto válido',
        message: 'Curto',
      });
      const errors = await validate(dto);
      const messageErrors = errors.filter((e) => e.property === 'message');
      expect(messageErrors.length).toBeGreaterThan(0);
    });
  });

  describe('template validation', () => {
    it('deve aceitar template opcional', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Assunto válido',
        message: 'Mensagem longa o suficiente',
        template: 'meu-template',
      });
      const errors = await validate(dto);
      const templateErrors = errors.filter((e) => e.property === 'template');
      expect(templateErrors.length).toBe(0);
    });

    it('deve rejeitar template não string', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Assunto válido',
        message: 'Mensagem longa o suficiente',
        template: 123,
      });
      const errors = await validate(dto);
      const templateErrors = errors.filter((e) => e.property === 'template');
      expect(templateErrors.length).toBeGreaterThan(0);
    });
  });

  describe('type validation', () => {
    it('deve aceitar type "individual"', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'individual',
        associationId: 1,
        userIds: [1, 2],
        subject: 'Assunto Válido',
        message: 'Mensagem longa o suficiente',
      });

      const errors = await validate(dto);
      const typeErrors = errors.filter((e) => e.property === 'type');
      expect(typeErrors.length).toBe(0);
    });

    it('deve aceitar type "collective"', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Assunto Válido',
        message: 'Mensagem longa o suficiente',
      });

      const errors = await validate(dto);
      const typeErrors = errors.filter((e) => e.property === 'type');
      expect(typeErrors.length).toBe(0);
    });

    it('deve rejeitar type inválido', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'INVALID_TYPE',
        associationId: 1,
        subject: 'Assunto Válido',
        message: 'Mensagem longa o suficiente',
      });

      const errors = await validate(dto);
      const typeError = errors.find((e) => e.property === 'type');
      expect(typeError).toBeDefined();
      expect(typeError?.constraints).toHaveProperty('isEnum');
    });
  });

  describe('associationId validation', () => {
    it('deve rejeitar associationId que não é número', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: '1',
        subject: 'Assunto Válido',
        message: 'Mensagem longa o suficiente',
      });

      const errors = await validate(dto);
      const assocError = errors.find((e) => e.property === 'associationId');
      expect(assocError).toBeDefined();
      expect(assocError?.constraints).toHaveProperty('isNumber');
    });
  });

  describe('userIds validation (Conditional)', () => {
    it('deve exigir userIds se type for "individual"', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'individual',
        associationId: 1,
        // userIds omitido
        subject: 'Assunto Válido',
        message: 'Mensagem longa o suficiente',
      });

      const errors = await validate(dto);
      const userIdsError = errors.find((e) => e.property === 'userIds');

      expect(userIdsError).toBeDefined();
      expect(userIdsError?.constraints).toHaveProperty('isArray');
    });

    it('deve validar se userIds é array de números quando "individual"', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'individual',
        associationId: 1,
        userIds: ['1', '2'],
        subject: 'Assunto Válido',
        message: 'Mensagem longa o suficiente',
      });

      const errors = await validate(dto);
      const userIdsError = errors.find((e) => e.property === 'userIds');
      expect(userIdsError).toBeDefined();
      expect(userIdsError?.constraints).toHaveProperty('isNumber');
    });

    it('deve ignorar validação de userIds se type for "collective"', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        userIds: null,
        subject: 'Assunto Válido',
        message: 'Mensagem longa o suficiente',
      });

      const errors = await validate(dto);
      const userIdsError = errors.find((e) => e.property === 'userIds');
      expect(userIdsError).toBeUndefined();
    });
  });

  describe('subject validation', () => {
    it('deve rejeitar subject menor que 3 caracteres', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Oi',
        message: 'Mensagem longa o suficiente',
      });

      const errors = await validate(dto);
      const subjectError = errors.find((e) => e.property === 'subject');
      expect(subjectError).toBeDefined();
      expect(subjectError?.constraints).toHaveProperty('minLength');
    });

    it('deve aceitar subject válido', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Aviso Importante',
        message: 'Mensagem longa o suficiente',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'subject')).toBe(false);
    });
  });

  describe('message validation', () => {
    it('deve rejeitar message menor que 10 caracteres', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Assunto Válido',
        message: 'Curta',
      });

      const errors = await validate(dto);
      const messageError = errors.find((e) => e.property === 'message');
      expect(messageError).toBeDefined();
      expect(messageError?.constraints).toHaveProperty('minLength');
    });
  });

  describe('template validation', () => {
    it('deve aceitar template omitido (opcional)', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Assunto Válido',
        message: 'Mensagem longa o suficiente',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'template')).toBe(false);
    });

    it('deve aceitar template válido', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Assunto Válido',
        message: 'Mensagem longa o suficiente',
        template: 'welcome-email',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve rejeitar template que não é string', async () => {
      const dto = plainToInstance(SendNotificationDto, {
        type: 'collective',
        associationId: 1,
        subject: 'Assunto Válido',
        message: 'Mensagem longa o suficiente',
        template: 123,
      });

      const errors = await validate(dto);
      const templateError = errors.find((e) => e.property === 'template');
      expect(templateError).toBeDefined();
      expect(templateError?.constraints).toHaveProperty('isString');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '@/mail/mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';

describe('MailService', () => {
  let service: MailService;
  let mockMailerService: jest.Mocked<MailerService>;

  beforeEach(async () => {
    mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendResetPasswordEmail', () => {
    const defaultParams = {
      to: 'user@test.com',
      resetToken: '123456',
      userName: 'João Silva',
    };

    it('deve enviar email de reset com dados básicos', async () => {
      await service.sendResetPasswordEmail(
        defaultParams.to,
        defaultParams.resetToken,
        defaultParams.userName,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: defaultParams.to,
        subject: 'Seu código de redefinição de senha',
        template: 'reset-password',
        context: {
          userName: defaultParams.userName,
          resetToken: defaultParams.resetToken,
          expiryDateStr: null,
          metadata: undefined,
        },
      });
    });

    it('deve incluir metadata quando fornecida', async () => {
      const metadata = {
        expiryDate: new Date('2025-11-15T12:00:00Z'),
        location: 'São Paulo, BR',
        device: 'Windows 10',
        browser: 'Chrome',
        ipAddress: '192.168.1.1',
      };

      await service.sendResetPasswordEmail(
        defaultParams.to,
        defaultParams.resetToken,
        defaultParams.userName,
        metadata,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.metadata).toEqual(metadata);
      expect(callArgs.context!.expiryDateStr).toBeTruthy();
    });

    it('deve formatar expiryDate corretamente em pt-BR', async () => {
      const expiryDate = new Date('2025-11-15T14:30:45Z');
      const metadata = { expiryDate };

      await service.sendResetPasswordEmail(
        defaultParams.to,
        defaultParams.resetToken,
        defaultParams.userName,
        metadata,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.expiryDateStr).toContain('novembro');
      expect(callArgs.context!.expiryDateStr).toContain('2025');
    });

    it('deve incluir location, device, browser e ipAddress no contexto', async () => {
      const metadata = {
        expiryDate: new Date(),
        location: 'Rio de Janeiro',
        device: 'macOS',
        browser: 'Safari',
        ipAddress: '10.0.0.1',
      };

      await service.sendResetPasswordEmail(
        defaultParams.to,
        defaultParams.resetToken,
        defaultParams.userName,
        metadata,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.metadata.location).toBe('Rio de Janeiro');
      expect(callArgs.context!.metadata.device).toBe('macOS');
      expect(callArgs.context!.metadata.browser).toBe('Safari');
      expect(callArgs.context!.metadata.ipAddress).toBe('10.0.0.1');
    });

    it('deve usar template reset-password', async () => {
      await service.sendResetPasswordEmail(
        defaultParams.to,
        defaultParams.resetToken,
        defaultParams.userName,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'reset-password',
        }),
      );
    });

    it('deve logar sucesso ao enviar email', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.sendResetPasswordEmail(
        defaultParams.to,
        defaultParams.resetToken,
        defaultParams.userName,
      );

      expect(logSpy).toHaveBeenCalledWith(
        'E-mail de redefinição de senha enviado com sucesso!',
      );
    });

    it('deve logar erro e re-lançar quando mailerService falha', async () => {
      const error = new Error('SMTP connection failed');
      mockMailerService.sendMail.mockRejectedValueOnce(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(
        service.sendResetPasswordEmail(
          defaultParams.to,
          defaultParams.resetToken,
          defaultParams.userName,
        ),
      ).rejects.toThrow('SMTP connection failed');

      expect(errorSpy).toHaveBeenCalledWith(
        'Erro ao enviar e-mail de redefinição de senha:',
        error,
      );
    });

    it('deve funcionar sem metadata opcional', async () => {
      await service.sendResetPasswordEmail(
        defaultParams.to,
        defaultParams.resetToken,
        defaultParams.userName,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.metadata).toBeUndefined();
      expect(callArgs.context!.expiryDateStr).toBeNull();
    });
  });

  describe('sendInviteEmail', () => {
    const defaultParams = {
      to: 'producer@test.com',
      userName: 'Maria Santos',
      associationName: 'Associação Teste',
      customMessage: 'Mensagem personalizada',
      acceptUrl: 'http://app.com/accept/token123',
      declineUrl: 'http://app.com/decline/token123',
      expiresAt: new Date('2025-12-01'),
    };

    it('deve enviar email de convite com todos os parâmetros', async () => {
      await service.sendInviteEmail(
        defaultParams.to,
        defaultParams.userName,
        defaultParams.associationName,
        defaultParams.customMessage,
        defaultParams.acceptUrl,
        defaultParams.declineUrl,
        defaultParams.expiresAt,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: defaultParams.to,
        subject: `Convite para fazer parte da ${defaultParams.associationName}`,
        template: 'invite',
        context: {
          userName: defaultParams.userName,
          associationName: defaultParams.associationName,
          customMessage: defaultParams.customMessage,
          acceptUrl: defaultParams.acceptUrl,
          declineUrl: defaultParams.declineUrl,
          expiresAt: expect.any(String),
        },
      });
    });

    it('deve incluir acceptUrl e declineUrl no contexto', async () => {
      await service.sendInviteEmail(
        defaultParams.to,
        defaultParams.userName,
        defaultParams.associationName,
        defaultParams.customMessage,
        defaultParams.acceptUrl,
        defaultParams.declineUrl,
        defaultParams.expiresAt,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.acceptUrl).toBe(defaultParams.acceptUrl);
      expect(callArgs.context!.declineUrl).toBe(defaultParams.declineUrl);
    });

    it('deve formatar data de expiração em pt-BR', async () => {
      const expiresAt = new Date('2025-12-25');

      await service.sendInviteEmail(
        defaultParams.to,
        defaultParams.userName,
        defaultParams.associationName,
        defaultParams.customMessage,
        defaultParams.acceptUrl,
        defaultParams.declineUrl,
        expiresAt,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.expiresAt).toContain('dezembro');
      expect(callArgs.context!.expiresAt).toContain('2025');
    });

    it('deve incluir customMessage quando fornecido', async () => {
      const customMessage = 'Gostaríamos muito de tê-lo conosco!';

      await service.sendInviteEmail(
        defaultParams.to,
        defaultParams.userName,
        defaultParams.associationName,
        customMessage,
        defaultParams.acceptUrl,
        defaultParams.declineUrl,
        defaultParams.expiresAt,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.customMessage).toBe(customMessage);
    });

    it('deve incluir customMessage null quando não fornecido', async () => {
      await service.sendInviteEmail(
        defaultParams.to,
        defaultParams.userName,
        defaultParams.associationName,
        null,
        defaultParams.acceptUrl,
        defaultParams.declineUrl,
        defaultParams.expiresAt,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.customMessage).toBeNull();
    });

    it('deve incluir associationName no subject', async () => {
      await service.sendInviteEmail(
        defaultParams.to,
        defaultParams.userName,
        'Cooperativa do Leite',
        defaultParams.customMessage,
        defaultParams.acceptUrl,
        defaultParams.declineUrl,
        defaultParams.expiresAt,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Convite para fazer parte da Cooperativa do Leite',
        }),
      );
    });

    it('deve usar template invite', async () => {
      await service.sendInviteEmail(
        defaultParams.to,
        defaultParams.userName,
        defaultParams.associationName,
        defaultParams.customMessage,
        defaultParams.acceptUrl,
        defaultParams.declineUrl,
        defaultParams.expiresAt,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'invite',
        }),
      );
    });

    it('deve logar sucesso com email do destinatário', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.sendInviteEmail(
        defaultParams.to,
        defaultParams.userName,
        defaultParams.associationName,
        defaultParams.customMessage,
        defaultParams.acceptUrl,
        defaultParams.declineUrl,
        defaultParams.expiresAt,
      );

      expect(logSpy).toHaveBeenCalledWith(
        `✅ Email de convite enviado para ${defaultParams.to}`,
      );
    });

    it('deve logar erro com email do destinatário e re-lançar', async () => {
      const error = new Error('Template not found');
      mockMailerService.sendMail.mockRejectedValueOnce(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(
        service.sendInviteEmail(
          defaultParams.to,
          defaultParams.userName,
          defaultParams.associationName,
          defaultParams.customMessage,
          defaultParams.acceptUrl,
          defaultParams.declineUrl,
          defaultParams.expiresAt,
        ),
      ).rejects.toThrow('Template not found');

      expect(errorSpy).toHaveBeenCalledWith(
        `❌ Erro ao enviar email de convite para ${defaultParams.to}:`,
        error,
      );
    });
  });

  describe('sendInviteAcceptedNotification', () => {
    const defaultParams = {
      to: 'admin@association.com',
      associationName: 'Associação Teste',
      userName: 'Pedro Costa',
      userId: 42,
    };

    beforeEach(() => {
      process.env.FRONTEND_URL = 'https://app.qualeider.com';
    });

    it('deve enviar notificação de aceite', async () => {
      await service.sendInviteAcceptedNotification(
        defaultParams.to,
        defaultParams.associationName,
        defaultParams.userName,
        defaultParams.userId,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: defaultParams.to,
        subject: `${defaultParams.userName} aceitou seu convite!`,
        template: 'invite-accepted',
        context: {
          associationName: defaultParams.associationName,
          userName: defaultParams.userName,
          userProfileUrl: expect.stringContaining('/association/members/42'),
        },
      });
    });

    it('deve construir userProfileUrl com FRONTEND_URL do env', async () => {
      process.env.FRONTEND_URL = 'https://custom.domain.com';

      await service.sendInviteAcceptedNotification(
        defaultParams.to,
        defaultParams.associationName,
        defaultParams.userName,
        defaultParams.userId,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.userProfileUrl).toBe(
        'https://custom.domain.com/association/members/42',
      );
    });

    it('deve usar fallback localhost:3000 se FRONTEND_URL não definido', async () => {
      delete process.env.FRONTEND_URL;

      await service.sendInviteAcceptedNotification(
        defaultParams.to,
        defaultParams.associationName,
        defaultParams.userName,
        defaultParams.userId,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.userProfileUrl).toBe(
        'http://localhost:3000/association/members/42',
      );
    });

    it('deve incluir userId na URL do perfil', async () => {
      await service.sendInviteAcceptedNotification(
        defaultParams.to,
        defaultParams.associationName,
        defaultParams.userName,
        123,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.userProfileUrl).toContain('/members/123');
    });

    it('deve usar template invite-accepted', async () => {
      await service.sendInviteAcceptedNotification(
        defaultParams.to,
        defaultParams.associationName,
        defaultParams.userName,
        defaultParams.userId,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'invite-accepted',
        }),
      );
    });

    it('deve logar sucesso', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.sendInviteAcceptedNotification(
        defaultParams.to,
        defaultParams.associationName,
        defaultParams.userName,
        defaultParams.userId,
      );

      expect(logSpy).toHaveBeenCalledWith(
        `✅ Notificação de aceite enviada para ${defaultParams.to}`,
      );
    });

    it('deve logar erro e re-lançar', async () => {
      const error = new Error('Network error');
      mockMailerService.sendMail.mockRejectedValueOnce(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(
        service.sendInviteAcceptedNotification(
          defaultParams.to,
          defaultParams.associationName,
          defaultParams.userName,
          defaultParams.userId,
        ),
      ).rejects.toThrow('Network error');

      expect(errorSpy).toHaveBeenCalledWith(
        `❌ Erro ao enviar notificação de aceite para ${defaultParams.to}:`,
        error,
      );
    });
  });

  describe('sendInviteDeclinedNotification', () => {
    const defaultParams = {
      to: 'admin@association.com',
      associationName: 'Associação Teste',
      userName: 'Ana Silva',
    };

    it('deve enviar notificação de recusa', async () => {
      await service.sendInviteDeclinedNotification(
        defaultParams.to,
        defaultParams.associationName,
        defaultParams.userName,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: defaultParams.to,
        subject: `${defaultParams.userName} recusou seu convite`,
        template: 'invite-declined',
        context: {
          associationName: defaultParams.associationName,
          userName: defaultParams.userName,
        },
      });
    });

    it('deve incluir userName no subject', async () => {
      await service.sendInviteDeclinedNotification(
        defaultParams.to,
        defaultParams.associationName,
        'Carlos Mendes',
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Carlos Mendes recusou seu convite',
        }),
      );
    });

    it('deve usar template invite-declined', async () => {
      await service.sendInviteDeclinedNotification(
        defaultParams.to,
        defaultParams.associationName,
        defaultParams.userName,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'invite-declined',
        }),
      );
    });

    it('deve logar sucesso', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.sendInviteDeclinedNotification(
        defaultParams.to,
        defaultParams.associationName,
        defaultParams.userName,
      );

      expect(logSpy).toHaveBeenCalledWith(
        `✅ Notificação de recusa enviada para ${defaultParams.to}`,
      );
    });

    it('deve logar erro e re-lançar', async () => {
      const error = new Error('Timeout');
      mockMailerService.sendMail.mockRejectedValueOnce(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(
        service.sendInviteDeclinedNotification(
          defaultParams.to,
          defaultParams.associationName,
          defaultParams.userName,
        ),
      ).rejects.toThrow('Timeout');

      expect(errorSpy).toHaveBeenCalledWith(
        `❌ Erro ao enviar notificação de recusa para ${defaultParams.to}:`,
        error,
      );
    });

    it('deve incluir associationName no contexto', async () => {
      await service.sendInviteDeclinedNotification(
        defaultParams.to,
        'Cooperativa ABC',
        defaultParams.userName,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.associationName).toBe('Cooperativa ABC');
    });
  });

  describe('sendNotificationEmail', () => {
    const defaultParams = {
      to: 'producer@test.com',
      subject: 'Atualização Importante',
      message: 'Há uma nova atualização disponível no sistema.',
      userName: 'João Produtor',
    };

    it('deve enviar notificação geral', async () => {
      await service.sendNotificationEmail(
        defaultParams.to,
        defaultParams.subject,
        defaultParams.message,
        defaultParams.userName,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: defaultParams.to,
        subject: defaultParams.subject,
        template: 'notification',
        context: {
          userName: defaultParams.userName,
          subject: defaultParams.subject,
          message: defaultParams.message,
          metadata: undefined,
        },
      });
    });

    it('deve incluir metadata quando fornecida', async () => {
      const metadata = {
        associationName: 'Associação XYZ',
        senderName: 'Admin Sistema',
        sentAt: '2025-11-15 10:30',
        category: 'urgent',
      };

      await service.sendNotificationEmail(
        defaultParams.to,
        defaultParams.subject,
        defaultParams.message,
        defaultParams.userName,
        metadata,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.metadata).toEqual(metadata);
    });

    it('deve incluir associationName, senderName, sentAt, category no metadata', async () => {
      const metadata = {
        associationName: 'Cooperativa do Sul',
        senderName: 'Gerente Regional',
        sentAt: '2025-11-15 14:00',
        category: 'info',
      };

      await service.sendNotificationEmail(
        defaultParams.to,
        defaultParams.subject,
        defaultParams.message,
        defaultParams.userName,
        metadata,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.metadata.associationName).toBe(
        'Cooperativa do Sul',
      );
      expect(callArgs.context!.metadata.senderName).toBe('Gerente Regional');
      expect(callArgs.context!.metadata.sentAt).toBe('2025-11-15 14:00');
      expect(callArgs.context!.metadata.category).toBe('info');
    });

    it('deve usar template notification', async () => {
      await service.sendNotificationEmail(
        defaultParams.to,
        defaultParams.subject,
        defaultParams.message,
        defaultParams.userName,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'notification',
        }),
      );
    });

    it('deve usar subject fornecido', async () => {
      await service.sendNotificationEmail(
        defaultParams.to,
        'Manutenção Programada',
        defaultParams.message,
        defaultParams.userName,
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Manutenção Programada',
        }),
      );
    });

    it('deve funcionar sem metadata opcional', async () => {
      await service.sendNotificationEmail(
        defaultParams.to,
        defaultParams.subject,
        defaultParams.message,
        defaultParams.userName,
      );

      const callArgs = mockMailerService.sendMail.mock.calls[0][0];
      expect(callArgs.context!.metadata).toBeUndefined();
    });

    it('deve logar sucesso', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.sendNotificationEmail(
        defaultParams.to,
        defaultParams.subject,
        defaultParams.message,
        defaultParams.userName,
      );

      expect(logSpy).toHaveBeenCalledWith(
        `E-mail enviado para ${defaultParams.to}`,
      );
    });

    it('deve logar erro e re-lançar', async () => {
      const error = new Error('Quota exceeded');
      mockMailerService.sendMail.mockRejectedValueOnce(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(
        service.sendNotificationEmail(
          defaultParams.to,
          defaultParams.subject,
          defaultParams.message,
          defaultParams.userName,
        ),
      ).rejects.toThrow('Quota exceeded');

      expect(errorSpy).toHaveBeenCalledWith(
        `Erro ao enviar e-mail para ${defaultParams.to}:`,
        error,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '@/mail/mail.service';
import { TemplateMailerService } from '@/mail/template-mailer.service';
import { Logger } from '@nestjs/common';

describe('MailService', () => {
  let service: MailService;
  let mockMailerService: jest.Mocked<TemplateMailerService>;

  beforeEach(async () => {
    mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: TemplateMailerService,
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
});

import { Test, TestingModule } from '@nestjs/testing';
import { EmailListener } from '@/listener/email.listener';
import { MailService } from '@/mail/mail.service';
import { IFailedEmailRepository } from '@/domain/repositories/failed-email.repository';
import { NotificationSendPayload } from '@/events/notification-payload.interface';

describe('EmailListener', () => {
  let listener: EmailListener;
  let mailService: MailService;
  let failedEmailRepository: IFailedEmailRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailListener,
        {
          provide: MailService,
          useValue: {
            sendNotificationEmail: jest.fn(),
          },
        },
        {
          provide: IFailedEmailRepository,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<EmailListener>(EmailListener);
    mailService = module.get<MailService>(MailService);
    failedEmailRepository = module.get<IFailedEmailRepository>(IFailedEmailRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(listener).toBeDefined();
  });

  it('deve enviar email com sucesso sem salvar na DLQ', async () => {
    const payload: NotificationSendPayload = {
      to: 'test@example.com',
      subject: 'Assunto de Teste',
      message: 'Mensagem de Teste',
      userName: 'Usuário Teste',
      metadata: { category: 'test' },
    };

    (mailService.sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);

    await listener.handleNotificationSend(payload);

    expect(mailService.sendNotificationEmail).toHaveBeenCalledWith(
      payload.to,
      payload.subject,
      payload.message,
      payload.userName,
      payload.metadata,
    );
    expect(failedEmailRepository.create).not.toHaveBeenCalled();
  });

  it('deve salvar na DLQ após falha máxima de tentativas', async () => {
    const payload: NotificationSendPayload = {
      to: 'fail@example.com',
      subject: 'Assunto Falha',
      message: 'Mensagem Falha',
      userName: 'Usuário Falha',
      metadata: { category: 'fail' },
    };

    const error = new Error('Erro SMTP');
    (mailService.sendNotificationEmail as jest.Mock).mockRejectedValue(error);

    // Mock setTimeout para rodar imediatamente
    jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => cb() as any);

    await listener.handleNotificationSend(payload);

    expect(mailService.sendNotificationEmail).toHaveBeenCalledTimes(3);

    expect(failedEmailRepository.create).toHaveBeenCalledWith({
      payload: {
        to: payload.to,
        subject: payload.subject,
        template: 'notification',
        context: {
          userName: payload.userName,
          subject: payload.subject,
          message: payload.message,
          metadata: payload.metadata,
        },
      },
      errorReason: error.message,
      retryCount: 3,
    });
  });
});

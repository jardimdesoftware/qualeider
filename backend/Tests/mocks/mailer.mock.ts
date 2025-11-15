import { MailerService } from '@nestjs-modules/mailer';

/**
 * Mock do MailerService para testes unitários
 * Simula o envio de emails sem realmente enviá-los
 */
export const createMockMailerService = (): jest.Mocked<MailerService> => {
  return {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    addTransporter: jest.fn(),
    get: jest.fn(),
  } as any;
};

/**
 * Helper para verificar se um email foi enviado para um destinatário específico
 */
export const expectEmailSent = (
  mailerMock: jest.Mocked<MailerService>,
  to: string,
  subject?: string,
): void => {
  expect(mailerMock.sendMail).toHaveBeenCalled();

  const calls = (mailerMock.sendMail as jest.Mock).mock.calls;
  const emailCall = calls.find((call) => {
    const mailOptions = call[0];
    return (
      mailOptions.to === to && (!subject || mailOptions.subject === subject)
    );
  });

  expect(emailCall).toBeDefined();
};

/**
 * Helper para verificar o template usado no email
 */
export const expectEmailTemplate = (
  mailerMock: jest.Mocked<MailerService>,
  template: string,
): void => {
  expect(mailerMock.sendMail).toHaveBeenCalled();

  const calls = (mailerMock.sendMail as jest.Mock).mock.calls;
  const templateCall = calls.find((call) => {
    const mailOptions = call[0];
    return mailOptions.template === template;
  });

  expect(templateCall).toBeDefined();
};

/**
 * Helper para obter o contexto do último email enviado
 */
export const getLastEmailContext = (
  mailerMock: jest.Mocked<MailerService>,
): any => {
  const calls = (mailerMock.sendMail as jest.Mock).mock.calls;
  if (calls.length === 0) {
    return null;
  }

  const lastCall = calls[calls.length - 1];
  return lastCall[0]?.context || null;
};

/**
 * Helper para resetar o mock do Mailer
 */
export const resetMailerMock = (
  mailerMock: jest.Mocked<MailerService>,
): void => {
  (mailerMock.sendMail as jest.Mock).mockReset();
};

/**
 * Mock de resposta de sucesso do envio de email
 */
export const mockEmailSuccess = () => ({
  messageId: `<${Date.now()}@example.com>`,
  response: '250 Message accepted',
  accepted: ['recipient@example.com'],
  rejected: [],
  pending: [],
});

/**
 * Mock de resposta de falha do envio de email
 */
export const mockEmailFailure = () => {
  throw new Error('SMTP connection failed');
};

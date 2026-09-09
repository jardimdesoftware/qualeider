import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

function createHost(retryAfterHeader?: number) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const getHeader = jest.fn().mockReturnValue(retryAfterHeader);

  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status, getHeader }),
      getRequest: () => ({ url: '/auth/login' }),
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  it('não deve expor a mensagem técnica de ThrottlerException ao usuário', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost(45);

    filter.catch(new ThrottlerException(), host);

    expect(status).toHaveBeenCalledWith(429);
    const body = json.mock.calls[0][0];

    expect(body.error).toBe('TooManyRequests');
    expect(JSON.stringify(body.message)).not.toMatch(/ThrottlerException/i);
    expect(body.message).toEqual([
      'Muitas tentativas realizadas. Aguarde alguns instantes e tente novamente.',
    ]);
    expect(body.retryAfter).toBe(45);
  });

  it('mantém o comportamento padrão para outras exceções HTTP', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost();

    filter.catch(new NotFoundException('Usuário não encontrado.'), host);

    expect(status).toHaveBeenCalledWith(404);
    const body = json.mock.calls[0][0];
    expect(body.message).toEqual(['Usuário não encontrado.']);
    expect(body.error).toBe('NotFoundException');
  });
});

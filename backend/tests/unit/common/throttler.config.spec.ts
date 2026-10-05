import { ExecutionContext } from '@nestjs/common';
import { throttlerConfig, THROTTLE_LIMIT } from '@/common/throttler/throttler.config';

const contextWith = (request: Record<string, unknown>) =>
  ({ switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;

describe('throttlerConfig (limite padrão)', () => {
  const limitFor = async (request: Record<string, unknown>) => {
    const { limit } = (throttlerConfig as any[])[0];
    return typeof limit === 'function' ? limit(contextWith(request)) : limit;
  };

  it('visitante recebe o limite baixo', async () => {
    expect(await limitFor({})).toBe(THROTTLE_LIMIT.ANONYMOUS);
    expect(THROTTLE_LIMIT.ANONYMOUS).toBe(10);
  });

  it('usuário autenticado recebe o limite maior', async () => {
    expect(await limitFor({ user: { id: 1 } })).toBe(THROTTLE_LIMIT.AUTHENTICATED);
    expect(THROTTLE_LIMIT.AUTHENTICATED).toBeGreaterThan(THROTTLE_LIMIT.ANONYMOUS);
  });
});

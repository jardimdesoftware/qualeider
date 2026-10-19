import { AppThrottlerGuard } from '@/guards/app-throttler-guards';

describe('AppThrottlerGuard.getTracker', () => {
  // Evita montar o módulo inteiro: getTracker não usa as dependências do guard.
  const guard = Object.create(AppThrottlerGuard.prototype) as AppThrottlerGuard;
  const trackerOf = (req: Record<string, unknown>) =>
    (guard as any).getTracker(req) as Promise<string>;

  it('usuário autenticado: o balde é do usuário, não do IP', async () => {
    expect(await trackerOf({ ip: '172.18.0.5', user: { id: 7 } })).toBe('user:7');
  });

  it('usuários diferentes atrás do mesmo IP têm baldes diferentes', async () => {
    const ip = '172.18.0.5';

    const a = await trackerOf({ ip, user: { id: 1 } });
    const b = await trackerOf({ ip, user: { id: 2 } });

    expect(a).not.toBe(b);
  });

  it('visitante: o balde é o IP real', async () => {
    expect(await trackerOf({ ip: '203.0.113.9' })).toBe('203.0.113.9');
  });

  it('id 0 ainda conta como usuário autenticado', async () => {
    expect(await trackerOf({ ip: '9.9.9.9', user: { id: 0 } })).toBe('user:0');
  });
});

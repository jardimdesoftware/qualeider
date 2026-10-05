import { ConfigService } from '@nestjs/config';
import { configureTrustProxy, resolveTrustProxyHops } from '@/presentation/proxy.config';

describe('resolveTrustProxyHops', () => {
  it.each([
    [undefined, 0],
    ['', 0],
    ['   ', 0],
    ['0', 0],
    ['1', 1],
    ['2', 2],
  ])('%p -> %p', (raw, expected) => {
    expect(resolveTrustProxyHops(raw as string | undefined)).toBe(expected);
  });

  it.each(['-1', '1.5', 'abc', 'true', '99', 'NaN'])(
    'valor inválido %p cai em 0 (nunca confia a mais)',
    (raw) => {
      expect(resolveTrustProxyHops(raw)).toBe(0);
    },
  );
});

describe('configureTrustProxy', () => {
  const buildApp = () => {
    const set = jest.fn();
    const app = { getHttpAdapter: () => ({ getInstance: () => ({ set }) }) } as any;
    return { app, set };
  };
  const configWith = (value?: string) =>
    ({ get: jest.fn().mockReturnValue(value) }) as unknown as ConfigService;

  it('com 1 salto, liga o trust proxy do Express', () => {
    const { app, set } = buildApp();

    expect(configureTrustProxy(app, configWith('1'))).toBe(1);
    expect(set).toHaveBeenCalledWith('trust proxy', 1);
  });

  it('sem configuração, não confia em nenhum proxy', () => {
    const { app, set } = buildApp();

    expect(configureTrustProxy(app, configWith(undefined))).toBe(0);
    expect(set).not.toHaveBeenCalled();
  });
});

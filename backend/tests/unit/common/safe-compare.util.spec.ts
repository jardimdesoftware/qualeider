import { safeEqual } from '@/common/utils/safe-compare.util';

describe('safeEqual', () => {
  it('true para valores iguais', () => {
    expect(safeEqual('123456', '123456')).toBe(true);
  });

  it('false para valores diferentes do mesmo tamanho', () => {
    expect(safeEqual('123456', '123457')).toBe(false);
  });

  it('false (sem lançar) para tamanhos diferentes', () => {
    expect(safeEqual('123456', '12345')).toBe(false);
    expect(safeEqual('', '1')).toBe(false);
  });

  it('trata caracteres multibyte pelo tamanho em bytes, sem lançar', () => {
    expect(safeEqual('ação', 'acao')).toBe(false);
    expect(safeEqual('ação', 'ação')).toBe(true);
  });
});

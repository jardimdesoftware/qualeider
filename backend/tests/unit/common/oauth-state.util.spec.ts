import {
  generateOAuthState,
  isValidOAuthState,
  readCookie,
} from '@/common/utils/oauth-state.util';

describe('oauth-state.util', () => {
  describe('generateOAuthState', () => {
    it('gera valores hexadecimais de 64 caracteres, diferentes a cada chamada', () => {
      const a = generateOAuthState();
      const b = generateOAuthState();

      expect(a).toMatch(/^[0-9a-f]{64}$/);
      expect(a).not.toBe(b);
    });
  });

  describe('readCookie', () => {
    it('lê o cookie pedido entre vários', () => {
      expect(readCookie('a=1; qualeider_oauth_state=abc; b=2', 'qualeider_oauth_state')).toBe('abc');
    });

    it('decodifica o valor', () => {
      expect(readCookie('k=a%20b', 'k')).toBe('a b');
    });

    it('retorna undefined quando o cookie não existe ou o header é vazio', () => {
      expect(readCookie(undefined, 'k')).toBeUndefined();
      expect(readCookie('', 'k')).toBeUndefined();
      expect(readCookie('outro=1', 'k')).toBeUndefined();
    });

    it('não confunde nomes que apenas terminam igual', () => {
      expect(readCookie('xk=1', 'k')).toBeUndefined();
    });

    it('retorna undefined para valor com escape inválido', () => {
      expect(readCookie('k=%E0%A4%A', 'k')).toBeUndefined();
    });
  });

  describe('isValidOAuthState', () => {
    it('aceita quando o state recebido é igual ao do cookie', () => {
      expect(isValidOAuthState('abc', 'abc')).toBe(true);
    });

    it('recusa quando diferem', () => {
      expect(isValidOAuthState('abc', 'abd')).toBe(false);
    });

    it('recusa quando os tamanhos diferem (sem lançar)', () => {
      expect(isValidOAuthState('abc', 'abcd')).toBe(false);
    });

    it('recusa quando falta o state ou o cookie', () => {
      expect(isValidOAuthState(undefined, 'abc')).toBe(false);
      expect(isValidOAuthState('abc', undefined)).toBe(false);
      expect(isValidOAuthState('', '')).toBe(false);
    });
  });
});

import {
  generateOAuthState,
  hashOAuthState,
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

  describe('hashOAuthState', () => {
    it('devolve SHA-256 em hex, determinístico e diferente do valor original', () => {
      const state = generateOAuthState();

      expect(hashOAuthState(state)).toMatch(/^[0-9a-f]{64}$/);
      expect(hashOAuthState(state)).toBe(hashOAuthState(state));
      expect(hashOAuthState(state)).not.toBe(state);
    });

    it('valores diferentes geram hashes diferentes', () => {
      expect(hashOAuthState('a')).not.toBe(hashOAuthState('b'));
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

    it('ignora pedaços sem "="', () => {
      expect(readCookie('semvalor; k=1', 'k')).toBe('1');
    });

    it('não confunde nomes que apenas terminam igual', () => {
      expect(readCookie('xk=1', 'k')).toBeUndefined();
    });

    it('retorna undefined para valor com escape inválido', () => {
      expect(readCookie('k=%E0%A4%A', 'k')).toBeUndefined();
    });
  });

  describe('isValidOAuthState', () => {
    it('aceita quando o hash do state recebido é o do cookie', () => {
      const state = generateOAuthState();

      expect(isValidOAuthState(state, hashOAuthState(state))).toBe(true);
    });

    it('recusa quando o state não corresponde ao hash do cookie', () => {
      expect(isValidOAuthState('abc', hashOAuthState('abd'))).toBe(false);
    });

    it('recusa o state cru no lugar do hash (o cookie não guarda o valor original)', () => {
      const state = generateOAuthState();

      expect(isValidOAuthState(state, state)).toBe(false);
    });

    it('recusa cookie de tamanho diferente (sem lançar)', () => {
      expect(isValidOAuthState('abc', 'curto')).toBe(false);
    });

    it('recusa quando falta o state ou o cookie', () => {
      expect(isValidOAuthState(undefined, hashOAuthState('abc'))).toBe(false);
      expect(isValidOAuthState('abc', undefined)).toBe(false);
      expect(isValidOAuthState('', '')).toBe(false);
    });
  });
});

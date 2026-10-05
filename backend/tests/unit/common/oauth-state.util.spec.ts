import {
  generateStateNonce,
  signStateNonce,
  matchesStateNonce,
  readCookie,
} from '@/common/utils/oauth-state.util';

const KEY = 'chave-de-teste';

describe('oauth-state.util', () => {
  describe('generateStateNonce', () => {
    it('gera valores hexadecimais de 64 caracteres, diferentes a cada chamada', () => {
      const a = generateStateNonce();
      const b = generateStateNonce();

      expect(a).toMatch(/^[0-9a-f]{64}$/);
      expect(a).not.toBe(b);
    });
  });

  describe('signStateNonce', () => {
    it('devolve SHA-256 em hex, determinístico e diferente do valor original', () => {
      const state = generateStateNonce();

      expect(signStateNonce(state, KEY)).toMatch(/^[0-9a-f]{64}$/);
      expect(signStateNonce(state, KEY)).toBe(signStateNonce(state, KEY));
      expect(signStateNonce(state, KEY)).not.toBe(state);
    });

    it('chaves diferentes geram valores diferentes (o cookie depende do segredo do servidor)', () => {
      expect(signStateNonce('a', 'chave-1')).not.toBe(signStateNonce('a', 'chave-2'));
    });

    it('valores diferentes geram hashes diferentes', () => {
      expect(signStateNonce('a', KEY)).not.toBe(signStateNonce('b', KEY));
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

  describe('matchesStateNonce', () => {
    it('aceita quando o hash do state recebido é o do cookie', () => {
      const state = generateStateNonce();

      expect(matchesStateNonce(state, signStateNonce(state, KEY), KEY)).toBe(true);
    });

    it('recusa quando o state não corresponde ao hash do cookie', () => {
      expect(matchesStateNonce('abc', signStateNonce('abd', KEY), KEY)).toBe(false);
    });

    it('recusa o state cru no lugar do hash (o cookie não guarda o valor original)', () => {
      const state = generateStateNonce();

      expect(matchesStateNonce(state, state, KEY)).toBe(false);
    });

    it('recusa cookie de tamanho diferente (sem lançar)', () => {
      expect(matchesStateNonce('abc', 'curto', KEY)).toBe(false);
    });

    it('recusa um cookie gerado com outra chave', () => {
      const state = generateStateNonce();

      expect(matchesStateNonce(state, signStateNonce(state, 'outra-chave'), KEY)).toBe(false);
    });

    it('recusa quando falta o state ou o cookie', () => {
      expect(matchesStateNonce(undefined, signStateNonce('abc', KEY), KEY)).toBe(false);
      expect(matchesStateNonce('abc', undefined, KEY)).toBe(false);
      expect(matchesStateNonce('', '', KEY)).toBe(false);
    });
  });
});

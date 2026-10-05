import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';
import { hashOAuthState } from '@/common/utils/oauth-state.util';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const STATE_COOKIE = 'qualeider_oauth_state';
// Mesma chave que o controller usa (JWT_SECRET do ambiente de teste).
const STATE_KEY = process.env.JWT_SECRET as string;

/**
 * OAuth do Google:
 *  - `state` aleatório por tentativa, amarrado ao navegador por um cookie
 *    HttpOnly — impede o login CSRF (vítima concluindo o login com o `code`
 *    da conta do atacante);
 *  - o destino do redirect nunca vem da requisição (sem open redirect).
 *
 * A troca de `code` por token com o Google é simulada (fetch), então nada sai
 * para a rede.
 */
describe('E2E: Google OAuth — state (CSRF) e redirects', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let fetchSpy: jest.SpyInstance;

  const idTokenFor = (email: string) => {
    const payload = Buffer.from(
      JSON.stringify({ email, email_verified: true, name: 'Pessoa Google' }),
    ).toString('base64url');
    return `header.${payload}.signature`;
  };

  const startLogin = async () => {
    const response = await testApp.request().get('/auth/google').redirects(0);
    const location = new URL(response.headers.location);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    return { response, location, state: location.searchParams.get('state')!, cookies };
  };

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);
    await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'oauth-admin@example.com', password: 'Admin@1234' }),
    );
  }, E2E_TIMEOUT);

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('GET /auth/google', () => {
    it('redireciona para o Google com um state aleatório e grava o mesmo valor em cookie HttpOnly', async () => {
      const { response, location, state, cookies } = await startLogin();

      expect(response.status).toBe(HttpStatus.FOUND);
      expect(location.origin).toBe('https://accounts.google.com');
      expect(state).toMatch(/^[0-9a-f]{64}$/);

      const stateCookie = cookies.find((c) => c.startsWith(`${STATE_COOKIE}=`))!;
      // O cookie guarda só o hash do state; o valor cru existe apenas na URL do Google.
      expect(stateCookie).toContain(`${STATE_COOKIE}=${hashOAuthState(state, STATE_KEY)}`);
      expect(stateCookie).not.toContain(state);
      expect(stateCookie).toMatch(/HttpOnly/i);
      expect(stateCookie).toMatch(/SameSite=Lax/i);
      expect(stateCookie).toContain('Path=/api/auth/google');
      expect(stateCookie).toMatch(/Max-Age=600/);
    });

    it('gera um state diferente a cada tentativa', async () => {
      const first = await startLogin();
      const second = await startLogin();

      expect(first.state).not.toBe(second.state);
    });
  });

  describe('GET /auth/google/callback — validação do state', () => {
    const expectLoginError = (response: any) => {
      expect(response.status).toBe(HttpStatus.FOUND);
      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(`${FRONTEND_URL}/login`);
      expect(location.searchParams.get('error')).toMatch(/inválida ou expirada/i);
    };

    it('recusa quando o navegador não tem o cookie de state (e não fala com o Google)', async () => {
      const response = await testApp
        .request()
        .get('/auth/google/callback?code=abc&state=forjado')
        .redirects(0);

      expectLoginError(response);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('recusa quando o state da URL difere do cookie (e não fala com o Google)', async () => {
      const { state } = await startLogin();

      const response = await testApp
        .request()
        .get('/auth/google/callback?code=abc&state=outro-valor')
        .set('Cookie', `${STATE_COOKIE}=${hashOAuthState(state, STATE_KEY)}`)
        .redirects(0);

      expectLoginError(response);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('recusa quando não há state na URL', async () => {
      const { state } = await startLogin();

      const response = await testApp
        .request()
        .get('/auth/google/callback?code=abc')
        .set('Cookie', `${STATE_COOKIE}=${hashOAuthState(state, STATE_KEY)}`)
        .redirects(0);

      expectLoginError(response);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('recusa quando não há code (ex.: usuário negou o acesso)', async () => {
      const { state } = await startLogin();

      const response = await testApp
        .request()
        .get(`/auth/google/callback?error=access_denied&state=${state}`)
        .set('Cookie', `${STATE_COOKIE}=${hashOAuthState(state, STATE_KEY)}`)
        .redirects(0);

      expectLoginError(response);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('descarta o cookie de state mesmo quando a validação falha (uso único)', async () => {
      const response = await testApp
        .request()
        .get('/auth/google/callback?code=abc&state=forjado')
        .redirects(0);

      const cleared = (response.headers['set-cookie'] as unknown as string[]).find((c) =>
        c.startsWith(`${STATE_COOKIE}=`),
      )!;
      expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it('com state válido segue para o Google; se o Google recusar, volta ao login com erro', async () => {
      const { state } = await startLogin();
      fetchSpy.mockResolvedValueOnce({ ok: false, status: 400 } as Response);

      const response = await testApp
        .request()
        .get(`/auth/google/callback?code=abc&state=${state}`)
        .set('Cookie', `${STATE_COOKIE}=${hashOAuthState(state, STATE_KEY)}`)
        .redirects(0);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HttpStatus.FOUND);
      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(`${FRONTEND_URL}/login`);
      expect(location.searchParams.get('error')).toBe('Não foi possível autenticar com o Google.');
    });

    it('fluxo completo: state válido + Google ok → redireciona ao frontend com um JWT utilizável', async () => {
      const { state } = await startLogin();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: idTokenFor('fluxo-completo@ifpe.edu.br') }),
      } as Response);

      const response = await testApp
        .request()
        .get(`/auth/google/callback?code=abc&state=${state}`)
        .set('Cookie', `${STATE_COOKIE}=${hashOAuthState(state, STATE_KEY)}`)
        .redirects(0);

      expect(response.status).toBe(HttpStatus.FOUND);
      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(`${FRONTEND_URL}/google-callback`);

      const token = location.searchParams.get('token')!;
      await testApp
        .request()
        .get('/animals')
        .set(authHelper.authHeader(token))
        .expect(HttpStatus.OK);
    });

    it('o state não pode ser reaproveitado: o mesmo par (cookie, state) é recusado na 2ª vez sem o cookie', async () => {
      const { state } = await startLogin();
      fetchSpy.mockResolvedValue({ ok: false, status: 400 } as Response);

      await testApp
        .request()
        .get(`/auth/google/callback?code=abc&state=${state}`)
        .set('Cookie', `${STATE_COOKIE}=${hashOAuthState(state, STATE_KEY)}`)
        .redirects(0);

      // O navegador já recebeu a instrução de apagar o cookie; sem ele, o
      // mesmo state na URL não vale mais.
      const replay = await testApp
        .request()
        .get(`/auth/google/callback?code=abc&state=${state}`)
        .redirects(0);

      expect(new URL(replay.headers.location).searchParams.get('error')).toMatch(
        /inválida ou expirada/i,
      );
    });
  });

  describe('Open redirect (CWE-601): o destino nunca vem da requisição', () => {
    const evil = 'https://evil.example/phish';
    const hostile = ['callbackUrl', 'next', 'redirect', 'redirect_uri', 'returnTo', 'url'];
    const hostileQuery = hostile.map((k) => `${k}=${encodeURIComponent(evil)}`).join('&');

    it('GET /auth/google ignora parâmetros de redirecionamento', async () => {
      const response = await testApp
        .request()
        .get(`/auth/google?${hostileQuery}`)
        .redirects(0);

      expect(response.status).toBe(HttpStatus.FOUND);
      expect(new URL(response.headers.location).origin).toBe('https://accounts.google.com');
      expect(response.headers.location).not.toContain('evil.example');
    });

    it('callback com erro só redireciona para o frontend configurado', async () => {
      const response = await testApp
        .request()
        .get(`/auth/google/callback?code=abc&state=x&${hostileQuery}`)
        .redirects(0);

      expect(response.headers.location.startsWith(FRONTEND_URL)).toBe(true);
      expect(response.headers.location).not.toContain('evil.example');
    });

    it('callback com sucesso também só redireciona para o frontend configurado', async () => {
      const { state } = await startLogin();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: idTokenFor('open-redirect@ifpe.edu.br') }),
      } as Response);

      const response = await testApp
        .request()
        .get(`/auth/google/callback?code=abc&state=${state}&${hostileQuery}`)
        .set('Cookie', `${STATE_COOKIE}=${hashOAuthState(state, STATE_KEY)}`)
        .redirects(0);

      expect(response.headers.location.startsWith(`${FRONTEND_URL}/google-callback?token=`)).toBe(true);
      expect(response.headers.location).not.toContain('evil.example');
    });
  });
});

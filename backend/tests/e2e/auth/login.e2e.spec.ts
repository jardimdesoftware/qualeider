import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

describe('E2E: Auth - Login', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('POST /auth/login', () => {
    it('deve retornar token JWT com credenciais válidas', async () => {
      const userData = UserFactory.build({
        email: 'test@example.com',
        password: 'Test@1234',
      });

      const user = await authHelper.createTestUser(userData);

      const response = await testApp
        .request()
        .post('/auth/login')
        .send({
          email: user.email,
          password: user.password,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.OK);
      expect(response.body).toHaveProperty('message', 'Login realizado com sucesso');
      expect(response.body.data).toHaveProperty('access_token');
      expect(typeof response.body.data.access_token).toBe('string');
      expect(response.body.data.access_token.length).toBeGreaterThan(0);
    });

    it('deve retornar 401 com senha incorreta', async () => {
      const userData = UserFactory.build({
        email: 'test2@example.com',
        password: 'Test@1234',
      });

      const user = await authHelper.createTestUser(userData);

      await testApp
        .request()
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar 401 com email inexistente', async () => {
      await testApp
        .request()
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@1234',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar 400 com dados inválidos', async () => {
      await testApp
        .request()
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Test@1234',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 com dados vazios', async () => {
      await testApp.request().post('/auth/login').send({}).expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 sem senha', async () => {
      await testApp
        .request()
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 sem email', async () => {
      await testApp
        .request()
        .post('/auth/login')
        .send({
          password: 'Test@1234',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/login - Helper shortcut', () => {
    it('deve fazer login usando AuthHelper', async () => {
      const { user, token } = await authHelper.createUserAndLogin({
        email: 'helper-test@example.com',
        password: 'Test@1234',
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('deve criar header de autorização corretamente', async () => {
      const { token } = await authHelper.createUserAndLogin({
        email: 'header-test@example.com',
        password: 'Test@1234',
      });

      const header = authHelper.authHeader(token);

      expect(header).toHaveProperty('Authorization');
      expect(header.Authorization).toBe(`Bearer ${token}`);
    });
  });
});
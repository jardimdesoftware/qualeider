import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserRole } from '@/domain/enums/enums';
import { UserFactory, AnimalFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * Suíte de testes focada em segurança (OWASP-ish), fechando o débito
 * técnico DT-002 (Wiki > Riscos e Débitos Técnicos): até aqui a cobertura
 * de segurança era só estrutural (Prisma parametrizado, class-validator,
 * guard global) sem testes automatizados que provassem o comportamento.
 *
 * Não são testes de penetração de verdade — são regressões: se algum dia
 * alguém quebrar uma dessas proteções, o CI acusa antes de chegar em prod.
 */
describe('E2E: Segurança', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let adminToken: string;
  let admin2Token: string;
  let vaqueiroToken: string;
  let vaqueiroId: number;
  let admin2VaqueiroId: number;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const admin = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'sec-admin@example.com', password: 'Admin@1234' }),
    );
    adminToken = admin.token;

    const admin2 = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'sec-admin2@example.com', password: 'Admin2@1234' }),
    );
    admin2Token = admin2.token;

    const vaqueiroData = UserFactory.build({
      email: 'sec-vaqueiro@example.com',
      password: 'Vaqueiro@1234',
      role: UserRole.VAQUEIRO,
    });
    const vaqueiroCreated = await testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(adminToken))
      .send(vaqueiroData)
      .expect(HttpStatus.CREATED);
    vaqueiroId = vaqueiroCreated.body.data.id;
    vaqueiroToken = await authHelper.login(vaqueiroData.email!, vaqueiroData.password!);

    const admin2VaqueiroData = UserFactory.build({
      email: 'sec-vaqueiro2@example.com',
      password: 'Vaqueiro2@1234',
      role: UserRole.VAQUEIRO,
    });
    const admin2VaqueiroCreated = await testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(admin2Token))
      .send(admin2VaqueiroData)
      .expect(HttpStatus.CREATED);
    admin2VaqueiroId = admin2VaqueiroCreated.body.data.id;
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('Autenticação e tokens', () => {
    it('deve retornar 401 quando nenhum token é enviado', async () => {
      await testApp.request().get('/users').expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar 401 para token malformado (não é um JWT)', async () => {
      await testApp
        .request()
        .get('/users')
        .set({ Authorization: 'Bearer isso-nao-e-um-jwt' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar 401 quando a assinatura do token foi adulterada', async () => {
      const forged = jwt.sign(
        { sub: 1, userType: 'user', role: UserRole.ADMIN },
        'chave-secreta-errada-forjada-pelo-atacante',
        { expiresIn: '1h' },
      );
      await testApp
        .request()
        .get('/users')
        .set({ Authorization: `Bearer ${forged}` })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar 401 quando o token está expirado', async () => {
      const secret = process.env.JWT_SECRET as string;
      const expired = jwt.sign(
        { sub: 1, userType: 'user' },
        secret,
        { expiresIn: -10 }, // já expirou há 10s
      );
      await testApp
        .request()
        .get('/users')
        .set({ Authorization: `Bearer ${expired}` })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('nunca autentica um token cujo sub aponta pra um usuário que não existe', async () => {
      const secret = process.env.JWT_SECRET as string;
      const ghost = jwt.sign(
        { sub: 999999999, userType: 'user' },
        secret,
        { expiresIn: '1h' },
      );
      // JwtStrategy.validate() busca o usuário via UsersService.findOne, que
      // lança EntityNotFoundException (→ 404) antes mesmo de chegar no
      // `if (!entity) throw UnauthorizedException` da strategy — então o
      // resultado observável é 404, não 401. O que importa pro teste é que
      // em nenhum caso a requisição é autenticada (200).
      const response = await testApp
        .request()
        .get('/users')
        .set({ Authorization: `Bearer ${ghost}` });
      expect(response.status).not.toBe(HttpStatus.OK);
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND]).toContain(response.status);
    });
  });

  describe('Tentativas de injeção', () => {
    it('login com payload de SQL injection no email não autentica nem quebra a API', async () => {
      // "email" tem @IsEmail() no DTO, então esse payload nem chega na
      // camada de autenticação — é rejeitado ainda na validação (400).
      // Ainda mais seguro do que um 401: a query ao banco nunca acontece.
      const response = await testApp
        .request()
        .post('/auth/login')
        .send({ email: "' OR '1'='1' --", password: "' OR '1'='1' --" })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).not.toHaveProperty('data.access_token');
    });

    it('login com payload de SQL injection na senha não autentica nem quebra a API', async () => {
      await testApp
        .request()
        .post('/auth/login')
        .send({ email: 'sec-admin@example.com', password: "'; DROP TABLE \"User\"; --" })
        .expect(HttpStatus.UNAUTHORIZED);

      // Prova que a tabela sobreviveu: login legítimo continua funcionando.
      await testApp
        .request()
        .post('/auth/login')
        .send({ email: 'sec-admin@example.com', password: 'Admin@1234' })
        .expect(HttpStatus.OK);
    });

    it('payload de XSS em campo de texto é armazenado como string literal, não executado', async () => {
      const xssPayload = '<script>alert(document.cookie)</script>';
      const response = await testApp
        .request()
        .post('/animals')
        .set(authHelper.authHeader(vaqueiroToken))
        .send(AnimalFactory.build({ name: xssPayload, userId: vaqueiroId }))
        .expect(HttpStatus.CREATED);

      // A API devolve o payload intacto como dado (é o front que deve
      // escapar na hora de renderizar) — o teste garante que não vira
      // template/HTML executado nem quebra a serialização JSON da resposta.
      expect(response.body.data.name).toBe(xssPayload);
      expect(typeof response.body.data.name).toBe('string');
    });
  });

  describe('IDOR — POST /animals (cadastrar animal para outro rebanho)', () => {
    it('regressão IDOR: VAQUEIRO não consegue cadastrar animal em nome de usuário de outro tenant', async () => {
      await testApp
        .request()
        .post('/animals')
        .set(authHelper.authHeader(vaqueiroToken))
        .send(AnimalFactory.build({ userId: admin2VaqueiroId }))
        .expect(HttpStatus.FORBIDDEN);
    });

    it('regressão IDOR: ADMIN não consegue cadastrar animal para usuário de outro tenant', async () => {
      await testApp
        .request()
        .post('/animals')
        .set(authHelper.authHeader(adminToken))
        .send(AnimalFactory.build({ userId: admin2VaqueiroId }))
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('Mass assignment / escalação de privilégio', () => {
    it('POST /users (cadastro público) ignora role enviado pelo cliente e força ADMIN', async () => {
      const response = await testApp
        .request()
        .post('/users')
        .send({
          ...UserFactory.build({ email: 'sec-selfsignup@example.com' }),
          role: 'VAQUEIRO', // tentativa de se cadastrar com role diferente do forçado pelo endpoint
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.role).toBe(UserRole.ADMIN);
    });

    it('POST /users (cadastro público) rejeita role fora do enum (tentativa de escalar pra um papel inexistente)', async () => {
      await testApp
        .request()
        .post('/users')
        .send({
          ...UserFactory.build({ email: 'sec-superadmin@example.com' }),
          role: 'SUPERADMIN',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('VAQUEIRO não consegue criar outro usuário via /users/internal mesmo pedindo role ADMIN no corpo', async () => {
      await testApp
        .request()
        .post('/users/internal')
        .set(authHelper.authHeader(vaqueiroToken))
        .send(UserFactory.build({ email: 'sec-escalado@example.com', role: UserRole.ADMIN }))
        .expect(HttpStatus.FORBIDDEN);
    });

    it('VAQUEIRO não consegue promover a própria conta pra ADMIN via PATCH', async () => {
      const response = await testApp
        .request()
        .patch(`/users/${vaqueiroId}`)
        .set(authHelper.authHeader(vaqueiroToken))
        .send({ role: UserRole.ADMIN })
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body).not.toHaveProperty('data.role', UserRole.ADMIN);
    });
  });

  describe('IDOR — GET /activity-logs (histórico de atividade)', () => {
    it('ADMIN consegue ver o histórico do próprio vaqueiro', async () => {
      await testApp
        .request()
        .get(`/activity-logs?userId=${vaqueiroId}`)
        .set(authHelper.authHeader(adminToken))
        .expect(HttpStatus.OK);
    });

    it('regressão IDOR: ADMIN não consegue ver histórico de vaqueiro de outro tenant', async () => {
      await testApp
        .request()
        .get(`/activity-logs?userId=${admin2VaqueiroId}`)
        .set(authHelper.authHeader(adminToken))
        .expect(HttpStatus.FORBIDDEN);
    });

    it('VAQUEIRO não consegue ver histórico de atividade (nem o próprio)', async () => {
      await testApp
        .request()
        .get(`/activity-logs?userId=${vaqueiroId}`)
        .set(authHelper.authHeader(vaqueiroToken))
        .expect(HttpStatus.FORBIDDEN);
    });

    it('retorna 401 sem token', async () => {
      await testApp
        .request()
        .get(`/activity-logs?userId=${vaqueiroId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});

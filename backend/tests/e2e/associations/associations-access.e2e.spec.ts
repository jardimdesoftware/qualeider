import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AssociationFactory, UserFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

/**
 * Antes, GET e PATCH /associations/:id não verificavam quem pedia: qualquer
 * usuário autenticado (e o cadastro público dá um token a qualquer visitante)
 * trocava e-mail e senha de uma associação e assumia a conta. As rotas de
 * métricas/convite usavam o `id` do token como id da associação, também para
 * usuários comuns (colisão de ids entre tabelas).
 */
describe('E2E: Associações — só o dono acessa e altera', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;

  let assocA: { id: number; email: string; password: string; token: string };
  let assocB: { id: number; token: string };
  let attackerToken: string;
  let memberToken: string;

  const get = (path: string, token: string) =>
    testApp.request().get(path).set(authHelper.authHeader(token));
  const patch = (path: string, token: string, body: object) =>
    testApp.request().patch(path).set(authHelper.authHeader(token)).send(body);

  const createAssociation = async () => {
    const data = AssociationFactory.build();
    const created = await testApp.request().post('/associations').send(data).expect(HttpStatus.CREATED);
    const token = await authHelper.login(data.email!, data.password!);
    return { id: created.body.data.id as number, email: data.email!, password: data.password!, token };
  };

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    assocA = await createAssociation();
    assocB = await createAssociation();

    attackerToken = (
      await authHelper.createUserAndLogin(
        UserFactory.buildAdmin({ email: 'assoc-atacante@example.com', password: 'Atk@123456' }),
      )
    ).token;

    // O cadastro público não escolhe associação; o vínculo vem de convite aceito
    // (aqui, direto no banco).
    const member = UserFactory.build();
    const registered = await testApp.request().post('/users').send(member).expect(HttpStatus.CREATED);
    await testApp
      .getPrismaService()
      .user.update({ where: { id: registered.body.data.id }, data: { associationId: assocA.id } });
    memberToken = await authHelper.login(member.email!, member.password!);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('tomada de conta (PATCH /associations/:id)', () => {
    it('um usuário comum não consegue trocar e-mail e senha de uma associação', async () => {
      await patch(`/associations/${assocA.id}`, attackerToken, {
        email: 'takeover@evil.example',
        password: 'Evil@12345',
      }).expect(HttpStatus.FORBIDDEN);

      // A associação continua sendo dela: credenciais originais valem, as do atacante não.
      await testApp
        .request()
        .post('/auth/login')
        .send({ email: assocA.email, password: assocA.password })
        .expect(HttpStatus.OK);
      await testApp
        .request()
        .post('/auth/login')
        .send({ email: 'takeover@evil.example', password: 'Evil@12345' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('outra associação também não altera', async () => {
      await patch(`/associations/${assocA.id}`, assocB.token, { name: 'Invadida' }).expect(HttpStatus.FORBIDDEN);
    });

    it('nem um membro da própria associação', async () => {
      await patch(`/associations/${assocA.id}`, memberToken, { name: 'Invadida' }).expect(HttpStatus.FORBIDDEN);
    });

    it('a própria associação altera os seus dados', async () => {
      const response = await patch(`/associations/${assocA.id}`, assocA.token, { name: 'Nome Novo' }).expect(
        HttpStatus.OK,
      );

      expect(response.body.data.name).toBe('Nome Novo');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('a própria associação troca a senha e consegue entrar com a nova', async () => {
      await patch(`/associations/${assocA.id}`, assocA.token, { password: 'Nova@12345' }).expect(HttpStatus.OK);

      await testApp
        .request()
        .post('/auth/login')
        .send({ email: assocA.email, password: 'Nova@12345' })
        .expect(HttpStatus.OK);
    });
  });

  describe('leitura (GET /associations/:id)', () => {
    it('usuário sem relação com a associação: 403', async () => {
      await get(`/associations/${assocA.id}`, attackerToken).expect(HttpStatus.FORBIDDEN);
    });

    it('outra associação: 403', async () => {
      await get(`/associations/${assocA.id}`, assocB.token).expect(HttpStatus.FORBIDDEN);
    });

    it('a própria associação lê (sem a senha)', async () => {
      const response = await get(`/associations/${assocA.id}`, assocA.token).expect(HttpStatus.OK);

      expect(response.body.data.id).toBe(assocA.id);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('um membro lê a sua associação, mas não a de outra', async () => {
      await get(`/associations/${assocA.id}`, memberToken).expect(HttpStatus.OK);
      await get(`/associations/${assocB.id}`, memberToken).expect(HttpStatus.FORBIDDEN);
    });

    it('id que não é número: 400', async () => {
      await get('/associations/abc', assocA.token).expect(HttpStatus.BAD_REQUEST);
      await patch('/associations/abc', assocA.token, { name: 'x' }).expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('rotas exclusivas de conta de associação', () => {
    const exclusive = [
      '/associations/metrics/associates',
      '/associations/metrics/herd',
      '/associations/available-producers',
      '/associations/reports/producer-ranking',
    ];

    it.each(exclusive)('%s: usuário comum e membro levam 403; a associação, 200', async (path) => {
      await get(path, attackerToken).expect(HttpStatus.FORBIDDEN);
      await get(path, memberToken).expect(HttpStatus.FORBIDDEN);
      await get(path, assocA.token).expect(HttpStatus.OK);
    });

    it('POST /associations/invite: usuário comum leva 403', async () => {
      await testApp
        .request()
        .post('/associations/invite')
        .set(authHelper.authHeader(attackerToken))
        .send({ userId: 1 })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('o relatório mensal continua disponível para usuários e associações', async () => {
      const now = new Date();
      const url = `/associations/reports/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;

      await get(url, attackerToken).expect(HttpStatus.OK);
      await get(url, assocA.token).expect(HttpStatus.OK);
    });
  });
});

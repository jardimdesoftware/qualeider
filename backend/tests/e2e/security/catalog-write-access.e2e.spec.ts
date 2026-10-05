import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AssociationFactory, UserFactory } from '../factories';
import { UserRole } from '@/domain/enums/enums';
import { HttpStatus } from '@nestjs/common';

/**
 * Raças e tipos de animal eram 100% públicos (@Public() na classe): qualquer
 * pessoa na internet, sem login, conseguia criar, alterar e apagar. Agora a
 * leitura continua pública (listas de apoio), e a escrita exige ADMIN.
 */
describe.each([
  { base: '/breeds', label: 'raças' },
  { base: '/animal-species', label: 'tipos de animal' },
])('E2E: $label — escrita restrita a ADMIN', ({ base }) => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let adminToken: string;
  let vaqueiroToken: string;
  let associationToken: string;
  const suffix = `${Date.now()}`.slice(-6);

  const write = (method: 'post' | 'put' | 'delete', path: string, token?: string, body?: object) => {
    const req = testApp.request()[method](path);
    if (token) req.set(authHelper.authHeader(token));
    return body ? req.send(body) : req;
  };

  const createAsAdmin = async (name: string) => {
    const response = await write('post', base, adminToken, { name }).expect(HttpStatus.CREATED);
    return response.body.data.id as number;
  };

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    adminToken = (
      await authHelper.createUserAndLogin(
        UserFactory.buildAdmin({ email: `cat-admin-${suffix}@example.com`, password: 'Admin@1234' }),
      )
    ).token;

    const vaqueiro = UserFactory.build({
      email: `cat-vaq-${suffix}@example.com`,
      password: 'Vaq@12345',
      role: UserRole.VAQUEIRO,
    });
    await write('post', '/users/internal', adminToken, vaqueiro).expect(HttpStatus.CREATED);
    vaqueiroToken = await authHelper.login(vaqueiro.email!, vaqueiro.password!);

    const association = AssociationFactory.build();
    await testApp.request().post('/associations').send(association).expect(HttpStatus.CREATED);
    associationToken = await authHelper.login(association.email!, association.password!);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('leitura continua pública', () => {
    it('lista sem login', async () => {
      await testApp.request().get(base).expect(HttpStatus.OK);
    });

    it('busca por id sem login', async () => {
      const id = await createAsAdmin(`Publico ${suffix}`);

      await testApp.request().get(`${base}/${id}`).expect(HttpStatus.OK);
    });
  });

  describe('criar', () => {
    it('sem login: 401 e nada é criado', async () => {
      const name = `SemLogin ${suffix}`;

      await write('post', base, undefined, { name }).expect(HttpStatus.UNAUTHORIZED);

      const list = await testApp.request().get(base).expect(HttpStatus.OK);
      expect(list.body.data.map((item: any) => item.name)).not.toContain(name);
    });

    it('funcionário (VAQUEIRO): 403', async () => {
      await write('post', base, vaqueiroToken, { name: `Vaq ${suffix}` }).expect(HttpStatus.FORBIDDEN);
    });

    it('associação: 403', async () => {
      await write('post', base, associationToken, { name: `Assoc ${suffix}` }).expect(HttpStatus.FORBIDDEN);
    });

    it('admin: 201', async () => {
      await write('post', base, adminToken, { name: `Admin ${suffix}` }).expect(HttpStatus.CREATED);
    });
  });

  describe('alterar', () => {
    let id: number;
    beforeAll(async () => {
      id = await createAsAdmin(`Alterar ${suffix}`);
    });

    it.each([
      ['sem login', undefined, HttpStatus.UNAUTHORIZED],
      ['funcionário', 'vaqueiro', HttpStatus.FORBIDDEN],
      ['associação', 'association', HttpStatus.FORBIDDEN],
    ])('%s: nega e não altera', async (_label, who, status) => {
      const token = who === 'vaqueiro' ? vaqueiroToken : who === 'association' ? associationToken : undefined;

      await write('put', `${base}/${id}`, token, { name: 'Vandalizado' }).expect(status);

      const current = await testApp.request().get(`${base}/${id}`).expect(HttpStatus.OK);
      expect(current.body.data.name).toBe(`Alterar ${suffix}`);
    });

    it('admin: 200', async () => {
      const response = await write('put', `${base}/${id}`, adminToken, { name: `Alterada ${suffix}` }).expect(
        HttpStatus.OK,
      );

      expect(response.body.data.name).toBe(`Alterada ${suffix}`);
    });
  });

  describe('excluir', () => {
    let id: number;
    beforeAll(async () => {
      id = await createAsAdmin(`Excluir ${suffix}`);
    });

    it.each([
      ['sem login', undefined, HttpStatus.UNAUTHORIZED],
      ['funcionário', 'vaqueiro', HttpStatus.FORBIDDEN],
      ['associação', 'association', HttpStatus.FORBIDDEN],
    ])('%s: nega e o registro continua existindo', async (_label, who, status) => {
      const token = who === 'vaqueiro' ? vaqueiroToken : who === 'association' ? associationToken : undefined;

      await write('delete', `${base}/${id}`, token).expect(status);

      await testApp.request().get(`${base}/${id}`).expect(HttpStatus.OK);
    });

    it('admin: 200 e o registro some', async () => {
      await write('delete', `${base}/${id}`, adminToken).expect(HttpStatus.OK);

      await testApp.request().get(`${base}/${id}`).expect(HttpStatus.NOT_FOUND);
    });
  });
});

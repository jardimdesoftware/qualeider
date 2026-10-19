import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory, AnimalFactory, DailyCollectionFactory } from '../factories';
import { UserRole } from '@/domain/enums/enums';
import { HttpStatus } from '@nestjs/common';

/**
 * GET /reports/monthly: resumo do mês do rebanho do usuário logado (admin e
 * funcionários do mesmo grupo). Sem cache: a coleta recém registrada aparece na
 * leitura seguinte.
 */
describe('E2E: Relatório mensal (GET /reports/monthly)', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let adminToken: string;
  let adminId: number;
  let vaqueiroToken: string;
  let animalId: number;
  let outsiderToken: string;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const report = async (token: string) => {
    const res = await testApp
      .request()
      .get(`/reports/monthly?year=${year}&month=${month}`)
      .set(authHelper.authHeader(token))
      .expect(HttpStatus.OK);
    return res.body.data as {
      month: string;
      totalProduction: number;
      totalCollections: number;
      totalAnimals: number;
      totalProducers: number;
    };
  };

  const registerCollection = async (token: string, userId: number, quantity: number) => {
    await testApp
      .request()
      .post('/daily-collections')
      .set(authHelper.authHeader(token))
      .send(DailyCollectionFactory.build({ userId, quantity, items: [{ animalId, quantity }] }))
      .expect(HttpStatus.CREATED);
  };

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const admin = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'relatorio.admin@example.com', password: 'Admin@12345' }),
    );
    adminToken = admin.token;
    adminId = admin.user.id!;

    await testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(adminToken))
      .send({
        name: 'Vaqueiro Relatório',
        email: 'relatorio.vaqueiro@example.com',
        password: 'Vaq@12345',
        role: UserRole.VAQUEIRO,
        userType: 'Pecuarista',
        userCategory: 'Fisica',
        city: 'Belo Jardim',
        state: 'PE',
      })
      .expect(HttpStatus.CREATED);
    vaqueiroToken = await authHelper.login('relatorio.vaqueiro@example.com', 'Vaq@12345');

    outsiderToken = (
      await authHelper.createUserAndLogin(
        UserFactory.buildAdmin({ email: 'relatorio.fora@example.com', password: 'Fora@12345' }),
      )
    ).token;

    const animal = await testApp
      .request()
      .post('/animals')
      .set(authHelper.authHeader(adminToken))
      .send(AnimalFactory.build({ userId: adminId }))
      .expect(HttpStatus.CREATED);
    animalId = animal.body.data.id;
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  it('sem login: 401', async () => {
    await testApp
      .request()
      .get(`/reports/monthly?year=${year}&month=${month}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('parâmetros inválidos: 400', async () => {
    await testApp
      .request()
      .get('/reports/monthly?year=2026&month=13')
      .set(authHelper.authHeader(adminToken))
      .expect(HttpStatus.BAD_REQUEST);
    await testApp.request().get('/reports/monthly').set(authHelper.authHeader(adminToken)).expect(HttpStatus.BAD_REQUEST);
  });

  it('lido antes de qualquer coleta, mostra zero; logo depois da coleta, mostra o total novo (sem cache velho)', async () => {
    const before = await report(adminToken);
    expect(before).toMatchObject({ totalProduction: 0, totalCollections: 0, totalAnimals: 1 });

    await registerCollection(adminToken, adminId, 18);

    const after = await report(adminToken);
    expect(after).toMatchObject({
      month: `${String(month).padStart(2, '0')}/${year}`,
      totalProduction: 18,
      totalCollections: 1,
      totalAnimals: 1,
    });
  });

  it('o funcionário do grupo vê o mesmo relatório do admin', async () => {
    expect(await report(vaqueiroToken)).toMatchObject({ totalProduction: 18, totalCollections: 1 });
  });

  it('cada nova coleta aparece na leitura seguinte', async () => {
    await registerCollection(adminToken, adminId, 7);

    expect(await report(adminToken)).toMatchObject({ totalProduction: 25, totalCollections: 2 });
  });

  it('outro dono (fora do grupo) não enxerga a produção alheia', async () => {
    expect(await report(outsiderToken)).toMatchObject({ totalProduction: 0, totalCollections: 0, totalAnimals: 0 });
  });
});

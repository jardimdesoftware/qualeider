import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory, AnimalFactory, DailyCollectionFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

/**
 * O relatorio mensal ficava 30 min em cache sem ser invalidado quando a fazenda
 * registrava coleta: o "Resumo mensal" seguia mostrando zeros logo depois de o
 * admin lancar 18 L.
 */
describe('E2E: Relatório mensal reflete a coleta recém registrada', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let token: string;
  let userId: number;
  let animalId: number;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const monthlyReport = async () => {
    const res = await testApp
      .request()
      .get(`/associations/reports/monthly?year=${year}&month=${month}`)
      .set(authHelper.authHeader(token))
      .expect(HttpStatus.OK);
    return res.body.data as { totalProduction: number; totalCollections: number; totalAnimals: number };
  };

  const registerCollection = async (quantity: number) => {
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

    const session = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'fazenda.relatorio@example.com', password: 'Fazenda@1234' }),
    );
    token = session.token!;
    userId = session.user!.id!;

    const animal = await testApp
      .request()
      .post('/animals')
      .set(authHelper.authHeader(token))
      .send(AnimalFactory.build({ userId }))
      .expect(HttpStatus.CREATED);
    animalId = animal.body.data.id;
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  it('lido antes de qualquer coleta, mostra zero produção; logo depois da coleta, mostra o total novo', async () => {
    const before = await monthlyReport();
    expect(before).toMatchObject({ totalProduction: 0, totalCollections: 0, totalAnimals: 1 });

    await registerCollection(18);

    const after = await monthlyReport();
    expect(after).toMatchObject({ totalProduction: 18, totalCollections: 1, totalAnimals: 1 });
  });

  it('cada nova coleta aparece na leitura seguinte', async () => {
    await registerCollection(7);

    const report = await monthlyReport();
    expect(report).toMatchObject({ totalProduction: 25, totalCollections: 2 });
  });
});

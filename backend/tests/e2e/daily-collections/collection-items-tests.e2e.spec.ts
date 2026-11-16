import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory, DailyCollectionFactory, AnimalFactory } from '../factories';
import { AnimalsService } from '@/application/services/animals/animals.service';
import { HttpStatus } from '@nestjs/common';

/**
 * Itens da coleta: teste da caneca e CMT são resultados diferentes, e cada
 * item tem a ordenha do dia (1 = primeira, 2 = segunda; padrão 1).
 */
describe('E2E: Coletas - teste da caneca, CMT e ordenha por item', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let userId: number;
  let token: string;
  let cowA: number;
  let cowB: number;

  const postCollection = (items: object[], quantity: number) =>
    testApp
      .request()
      .post('/daily-collections')
      .set('Authorization', `Bearer ${token}`)
      .send(DailyCollectionFactory.build({ userId, quantity, items: items as never }));

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);
    const login = await authHelper.createUserAndLogin(
      UserFactory.buildProducer({ email: 'itens@collections.com', password: 'Itens@12345' }),
    );
    userId = login.user.id!;
    token = login.token;

    const animals = testApp.getApp().get(AnimalsService);
    cowA = (await animals.create(AnimalFactory.build({ userId }) as never)).id as number;
    cowB = (await animals.create(AnimalFactory.build({ userId }) as never)).id as number;
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  it('guarda caneca e CMT separados no mesmo item, e a ordenha padrão é 1', async () => {
    const response = await postCollection(
      [{ animalId: cowA, quantity: 10, mugTestResult: 'Positivo', cmtResult: 'Suspeito' }],
      10,
    ).expect(HttpStatus.CREATED);

    const item = response.body.data.items[0];
    expect(item.mugTestResult).toBe('Positivo');
    expect(item.cmtResult).toBe('Suspeito');
    expect(item.milking).toBe(1);
  });

  it('os dois testes são opcionais e independentes', async () => {
    const response = await postCollection(
      [
        { animalId: cowA, quantity: 5, mugTestResult: 'Negativo' },
        { animalId: cowB, quantity: 5, cmtResult: 'Normal' },
      ],
      10,
    ).expect(HttpStatus.CREATED);

    const [a, b] = response.body.data.items;
    expect(a.mugTestResult).toBe('Negativo');
    expect(a.cmtResult).toBeNull();
    expect(b.mugTestResult).toBeNull();
    expect(b.cmtResult).toBe('Normal');
  });

  it('recusa resultado de caneca inválido e CMT no campo da caneca', async () => {
    await postCollection([{ animalId: cowA, quantity: 10, mugTestResult: 'Suspeito' }], 10).expect(
      HttpStatus.BAD_REQUEST,
    );
    await postCollection([{ animalId: cowA, quantity: 10, cmtResult: 'Negativo' }], 10).expect(
      HttpStatus.BAD_REQUEST,
    );
  });

  it('aceita a mesma vaca na 1ª e na 2ª ordenha e soma os dois litros', async () => {
    const response = await postCollection(
      [
        { animalId: cowA, quantity: 8, milking: 1 },
        { animalId: cowA, quantity: 6, milking: 2 },
      ],
      14,
    ).expect(HttpStatus.CREATED);

    const items = response.body.data.items as { milking: number; quantity: number }[];
    expect(items.map((i) => i.milking).sort()).toEqual([1, 2]);
    expect(items.reduce((sum, i) => sum + i.quantity, 0)).toBe(14);
  });

  it('recusa a mesma vaca duas vezes na mesma ordenha', async () => {
    const response = await postCollection(
      [
        { animalId: cowB, quantity: 5, milking: 2 },
        { animalId: cowB, quantity: 5, milking: 2 },
      ],
      10,
    ).expect(HttpStatus.BAD_REQUEST);

    expect(JSON.stringify(response.body)).toContain('mais de uma vez');
  });

  it.each([0, 3, 1.5])('recusa ordenha inválida (%s)', async (milking) => {
    await postCollection([{ animalId: cowA, quantity: 10, milking }], 10).expect(
      HttpStatus.BAD_REQUEST,
    );
  });

  it('o histórico da vaca devolve caneca, CMT e ordenha', async () => {
    await postCollection(
      [{ animalId: cowB, quantity: 12, mugTestResult: 'Negativo', cmtResult: 'Normal', milking: 1 }],
      12,
    ).expect(HttpStatus.CREATED);

    const history = await testApp
      .request()
      .get(`/daily-collections/animal/${cowB}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    const row = (history.body.data as Record<string, unknown>[]).find(
      (r) => r.mugTestResult === 'Negativo',
    );
    expect(row).toBeDefined();
    expect(row!.cmtResult).toBe('Normal');
    expect(row!.milking).toBe(1);
  });
});

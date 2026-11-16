import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory, AnimalFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

/**
 * Estágio de lactação da vaca: número da cria (1 = primeira cria, 2 = segunda...)
 * e data do último parto (base dos dias em lactação).
 */
describe('E2E: Animais - lactação (número da cria e data do parto)', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let userId: number;
  let token: string;

  const post = (body: object) =>
    testApp.request().post('/animals').set('Authorization', `Bearer ${token}`).send(body);

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);
    const login = await authHelper.createUserAndLogin(
      UserFactory.buildProducer({ email: 'lactacao@animals.com', password: 'Lactacao@1234' }),
    );
    userId = login.user.id!;
    token = login.token;
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  it('cria a vaca com número da cria e data do parto e devolve os dois', async () => {
    const response = await post(
      AnimalFactory.build({ userId, lactationNumber: 2, calvingDate: '2026-08-15' }),
    ).expect(HttpStatus.CREATED);

    expect(response.body.data.lactationNumber).toBe(2);
    expect(response.body.data.calvingDate).toMatch(/^2026-08-15/);
  });

  it('sem os campos, eles voltam nulos (continuam opcionais)', async () => {
    const response = await post(AnimalFactory.build({ userId })).expect(HttpStatus.CREATED);

    expect(response.body.data.lactationNumber).toBeNull();
    expect(response.body.data.calvingDate).toBeNull();
  });

  it('recusa data de parto no futuro', async () => {
    const amanha = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const response = await post(AnimalFactory.build({ userId, calvingDate: amanha })).expect(
      HttpStatus.BAD_REQUEST,
    );

    expect(JSON.stringify(response.body)).toContain('não pode estar no futuro');
  });

  it.each([0, 21, 1.5, -1])('recusa número da cria inválido (%s)', async (lactationNumber) => {
    await post(AnimalFactory.build({ userId, lactationNumber })).expect(HttpStatus.BAD_REQUEST);
  });

  it('recusa data de parto que não é uma data', async () => {
    await post(AnimalFactory.build({ userId, calvingDate: 'ontem' })).expect(HttpStatus.BAD_REQUEST);
  });

  it('atualiza o número da cria e a data do parto (vaca teve novo parto)', async () => {
    const created = await post(
      AnimalFactory.build({ userId, lactationNumber: 1, calvingDate: '2025-09-01' }),
    ).expect(HttpStatus.CREATED);
    const id = created.body.data.id as number;

    await testApp
      .request()
      .put(`/animals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ lactationNumber: 2, calvingDate: '2026-09-20' })
      .expect(HttpStatus.OK);

    const fetched = await testApp
      .request()
      .get(`/animals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);
    expect(fetched.body.data.lactationNumber).toBe(2);
    expect(fetched.body.data.calvingDate).toMatch(/^2026-09-20/);
  });

  it('atualizar sem mexer nos campos de lactação não os apaga', async () => {
    const created = await post(
      AnimalFactory.build({ userId, lactationNumber: 3, calvingDate: '2026-07-10' }),
    ).expect(HttpStatus.CREATED);
    const id = created.body.data.id as number;

    await testApp
      .request()
      .put(`/animals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renomeada' })
      .expect(HttpStatus.OK);

    const fetched = await testApp
      .request()
      .get(`/animals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);
    expect(fetched.body.data.name).toBe('Renomeada');
    expect(fetched.body.data.lactationNumber).toBe(3);
    expect(fetched.body.data.calvingDate).toMatch(/^2026-07-10/);
  });
});

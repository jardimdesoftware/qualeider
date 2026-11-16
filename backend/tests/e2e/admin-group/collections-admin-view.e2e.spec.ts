import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory, AnimalFactory, DailyCollectionFactory } from '../factories';
import { UserRole } from '@/domain/enums/enums';
import { HttpStatus } from '@nestjs/common';

/**
 * O vaqueiro coleta e escolhe para onde o leite vai; o ADMIN do grupo vê as
 * coletas registradas (quem registrou e o destino) e pode ajustá-las. Outro
 * admin não vê nem mexe.
 */
describe('E2E: Coletas registradas — visão do admin', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let admin: { id: number; token: string };
  let outroAdmin: { id: number; token: string };
  let vaqueiro: { id: number; token: string };
  let destinoA: number;
  let destinoB: number;
  let collectionId: number;
  let animalId: number;

  const auth = (token: string) => authHelper.authHeader(token);

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const a = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'cr-admin@example.com', password: 'Admin@1234' }),
    );
    admin = { id: a.user.id!, token: a.token };
    const b = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'cr-outro@example.com', password: 'Outro@1234' }),
    );
    outroAdmin = { id: b.user.id!, token: b.token };

    const vaq = UserFactory.build({ email: 'cr-vaq@example.com', password: 'Vaq@12345', role: UserRole.VAQUEIRO });
    const created = await testApp
      .request()
      .post('/users/internal')
      .set(auth(admin.token))
      .send({ ...vaq, name: 'Vaqueiro Zé' })
      .expect(HttpStatus.CREATED);
    vaqueiro = { id: created.body.data.id, token: await authHelper.login(vaq.email!, vaq.password!) };

    const dest = async (name: string) =>
      (await testApp.request().post('/destinations').set(auth(admin.token)).send({ name }).expect(HttpStatus.CREATED))
        .body.data.id as number;
    destinoA = await dest('Laticínio');
    destinoB = await dest('Consumo');

    animalId = (
      await testApp
        .request()
        .post('/animals')
        .set(auth(vaqueiro.token))
        .send(AnimalFactory.build({ userId: vaqueiro.id }))
        .expect(HttpStatus.CREATED)
    ).body.data.id;

    // O vaqueiro coleta e manda o leite para o laticínio.
    const collection = await testApp
      .request()
      .post('/daily-collections')
      .set(auth(vaqueiro.token))
      .send(
        DailyCollectionFactory.build({
          userId: vaqueiro.id,
          quantity: 18,
          items: [{ animalId, quantity: 18 }],
          destinationId: destinoA,
        } as never),
      )
      .expect(HttpStatus.CREATED);
    collectionId = collection.body.data.id;
  }, E2E_TIMEOUT * 2);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  it('a coleta devolve quem registrou (só id e nome) e o destino', async () => {
    const response = await testApp
      .request()
      .get(`/daily-collections/${collectionId}`)
      .set(auth(admin.token))
      .expect(HttpStatus.OK);

    expect(response.body.data.user).toEqual({ id: vaqueiro.id, name: 'Vaqueiro Zé' });
    expect(response.body.data.destination).toEqual({ id: destinoA, name: 'Laticínio' });
    expect(JSON.stringify(response.body)).not.toContain('password');
  });

  it('o admin lista as coletas do grupo e vê a do vaqueiro com destino e autor', async () => {
    const response = await testApp
      .request()
      .get(`/daily-collections/user/${admin.id}`)
      .set(auth(admin.token))
      .expect(HttpStatus.OK);

    const row = (response.body.data as { id: number; user?: { name: string }; destination?: { name: string } }[]).find(
      (c) => c.id === collectionId,
    );
    expect(row).toBeDefined();
    expect(row!.user?.name).toBe('Vaqueiro Zé');
    expect(row!.destination?.name).toBe('Laticínio');
  });

  it('o admin troca o destino da coleta do vaqueiro', async () => {
    await testApp
      .request()
      .put(`/daily-collections/${collectionId}`)
      .set(auth(admin.token))
      .send({ destinationId: destinoB })
      .expect(HttpStatus.OK);

    const response = await testApp
      .request()
      .get(`/daily-collections/${collectionId}`)
      .set(auth(admin.token))
      .expect(HttpStatus.OK);
    expect(response.body.data.destination.name).toBe('Consumo');
  });

  it('recusa trocar para um destino que não existe', async () => {
    await testApp
      .request()
      .put(`/daily-collections/${collectionId}`)
      .set(auth(admin.token))
      .send({ destinationId: 999999 })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('outro admin não vê nem altera a coleta', async () => {
    await testApp.request().get(`/daily-collections/${collectionId}`).set(auth(outroAdmin.token)).expect(HttpStatus.FORBIDDEN);
    await testApp
      .request()
      .put(`/daily-collections/${collectionId}`)
      .set(auth(outroAdmin.token))
      .send({ destinationId: destinoA })
      .expect(HttpStatus.FORBIDDEN);
    await testApp.request().delete(`/daily-collections/${collectionId}`).set(auth(outroAdmin.token)).expect(HttpStatus.FORBIDDEN);
  });

  it('o admin exclui a coleta registrada', async () => {
    await testApp.request().delete(`/daily-collections/${collectionId}`).set(auth(admin.token)).expect(HttpStatus.OK);

    // A exclusão só marca a coleta como inativa: ela sai da lista do admin.
    const list = await testApp
      .request()
      .get(`/daily-collections/user/${admin.id}`)
      .set(auth(admin.token))
      .expect(HttpStatus.OK);
    expect((list.body.data as { id: number }[]).some((c) => c.id === collectionId)).toBe(false);
  });
});

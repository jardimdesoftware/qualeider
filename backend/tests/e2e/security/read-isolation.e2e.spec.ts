import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AnimalFactory, DailyCollectionFactory, UserFactory } from '../factories';
import { UserRole } from '@/domain/enums/enums';
import { HttpStatus } from '@nestjs/common';

/**
 * Antes, qualquer ADMIN (e o cadastro público sempre cria ADMIN) lia os usuários,
 * animais e coletas de TODOS os donos. Agora cada um lê só o próprio escopo:
 * ele mesmo + funcionários vinculados.
 */
describe('E2E: Leitura entre donos — cada um lê só o próprio escopo', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;

  // Dono A (com um funcionário) e dono B (com um funcionário).
  let adminA: { id: number; token: string };
  let adminB: { id: number; token: string };
  let vaqA: { id: number; token: string };
  let vaqB: { id: number; token: string };
  let animalOfA: number;
  let animalOfVaqA: number;
  let animalOfB: number;
  let collectionOfA: number;
  let collectionOfB: number;

  const get = (path: string, token: string) =>
    testApp.request().get(path).set(authHelper.authHeader(token));
  const ids = (body: any) => (body.data as any[]).map((x) => x.id);

  const createVaqueiro = async (adminToken: string, email: string) => {
    const data = UserFactory.build({ email, password: 'Vaq@12345', role: UserRole.VAQUEIRO });
    const created = await testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(adminToken))
      .send(data)
      .expect(HttpStatus.CREATED);
    return { id: created.body.data.id as number, token: await authHelper.login(email, 'Vaq@12345') };
  };

  const createAnimal = async (token: string, userId: number, name: string) =>
    (
      await testApp
        .request()
        .post('/animals')
        .set(authHelper.authHeader(token))
        .send(AnimalFactory.build({ name, userId }))
        .expect(HttpStatus.CREATED)
    ).body.data.id as number;

  const createCollection = async (token: string, userId: number, animalId: number) =>
    (
      await testApp
        .request()
        .post('/daily-collections')
        .set(authHelper.authHeader(token))
        .send(DailyCollectionFactory.build({ userId, quantity: 20, items: [{ animalId, quantity: 20 }] }))
        .expect(HttpStatus.CREATED)
    ).body.data.id as number;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const a = await authHelper.createUserAndLogin(UserFactory.buildAdmin({ email: 'iso-a@example.com', password: 'AdminA@1234' }));
    const b = await authHelper.createUserAndLogin(UserFactory.buildAdmin({ email: 'iso-b@example.com', password: 'AdminB@1234' }));
    adminA = { id: a.user.id!, token: a.token };
    adminB = { id: b.user.id!, token: b.token };
    vaqA = await createVaqueiro(adminA.token, 'iso-vaq-a@example.com');
    vaqB = await createVaqueiro(adminB.token, 'iso-vaq-b@example.com');

    animalOfA = await createAnimal(adminA.token, adminA.id, 'Vaca A');
    animalOfVaqA = await createAnimal(vaqA.token, vaqA.id, 'Vaca do vaqueiro A');
    animalOfB = await createAnimal(adminB.token, adminB.id, 'Vaca B');
    collectionOfA = await createCollection(adminA.token, adminA.id, animalOfA);
    collectionOfB = await createCollection(adminB.token, adminB.id, animalOfB);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('animais', () => {
    it('GET /animals/:id: o dono lê, o funcionário do grupo lê, outro dono leva 403', async () => {
      await get(`/animals/${animalOfA}`, adminA.token).expect(HttpStatus.OK);
      await get(`/animals/${animalOfA}`, vaqA.token).expect(HttpStatus.OK);
      await get(`/animals/${animalOfA}`, adminB.token).expect(HttpStatus.FORBIDDEN);
      await get(`/animals/${animalOfA}`, vaqB.token).expect(HttpStatus.FORBIDDEN);
    });

    it('GET /animals (lista): só o escopo, mesmo pedindo o userId de outro dono', async () => {
      const own = await get('/animals', adminA.token).expect(HttpStatus.OK);
      expect(ids(own.body)).toEqual(expect.arrayContaining([animalOfA, animalOfVaqA]));
      expect(ids(own.body)).not.toContain(animalOfB);

      const spoofed = await get(`/animals?userId=${adminB.id}`, adminA.token).expect(HttpStatus.OK);
      expect(ids(spoofed.body)).toEqual([]);
    });

    it('GET /animals/user/:userId: admin vê o próprio grupo; id de outro dono dá 403', async () => {
      const own = await get(`/animals/user/${adminA.id}`, adminA.token).expect(HttpStatus.OK);
      expect(ids(own.body)).toEqual(expect.arrayContaining([animalOfA, animalOfVaqA]));
      expect(ids(own.body)).not.toContain(animalOfB);

      await get(`/animals/user/${adminB.id}`, adminA.token).expect(HttpStatus.FORBIDDEN);
      await get(`/animals/user/${adminA.id}`, adminB.token).expect(HttpStatus.FORBIDDEN);
    });

    it('funcionário vê o rebanho do próprio admin e nada do outro', async () => {
      const mine = await get(`/animals/user/${vaqA.id}`, vaqA.token).expect(HttpStatus.OK);
      expect(ids(mine.body)).toEqual(expect.arrayContaining([animalOfA, animalOfVaqA]));
      expect(ids(mine.body)).not.toContain(animalOfB);
    });
  });

  describe('coletas', () => {
    it('GET /daily-collections/:id: dono e funcionário leem, outro dono leva 403', async () => {
      await get(`/daily-collections/${collectionOfA}`, adminA.token).expect(HttpStatus.OK);
      await get(`/daily-collections/${collectionOfA}`, vaqA.token).expect(HttpStatus.OK);
      await get(`/daily-collections/${collectionOfA}`, adminB.token).expect(HttpStatus.FORBIDDEN);
    });

    it('GET /daily-collections (lista) e /user/:userId: só o escopo', async () => {
      const list = await get(`/daily-collections?userId=${adminB.id}`, adminA.token).expect(HttpStatus.OK);
      expect(ids(list.body)).toEqual([]);

      const own = await get(`/daily-collections/user/${adminA.id}`, adminA.token).expect(HttpStatus.OK);
      expect(ids(own.body)).toContain(collectionOfA);
      expect(ids(own.body)).not.toContain(collectionOfB);

      await get(`/daily-collections/user/${adminB.id}`, adminA.token).expect(HttpStatus.FORBIDDEN);
    });

    it('GET /daily-collections/animal/:animalId: histórico só de animal do escopo', async () => {
      await get(`/daily-collections/animal/${animalOfA}`, adminA.token).expect(HttpStatus.OK);
      await get(`/daily-collections/animal/${animalOfA}`, adminB.token).expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('usuários', () => {
    it('GET /users: o admin lista só ele e os próprios funcionários', async () => {
      const response = await get('/users', adminA.token).expect(HttpStatus.OK);
      const emails = (response.body.data as any[]).map((u) => u.email);

      expect(emails).toEqual(expect.arrayContaining(['iso-a@example.com', 'iso-vaq-a@example.com']));
      expect(emails).not.toContain('iso-b@example.com');
      expect(emails).not.toContain('iso-vaq-b@example.com');
    });

    it('GET /users/:id: outro dono e o funcionário dele levam 403', async () => {
      await get(`/users/${adminB.id}`, adminA.token).expect(HttpStatus.FORBIDDEN);
      await get(`/users/${vaqB.id}`, adminA.token).expect(HttpStatus.FORBIDDEN);
      await get(`/users/${vaqA.id}`, adminA.token).expect(HttpStatus.OK);
      await get(`/users/${adminA.id}`, adminA.token).expect(HttpStatus.OK);
    });
  });
});

import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory, AnimalFactory, DailyCollectionFactory } from '../factories';
import { UserRole } from '@/domain/enums/enums';
import { AnimalsService } from '@/application/services/animals/animals.service';
import { HttpStatus } from '@nestjs/common';

/**
 * Destinos do leite: CRUD como o de raças (só o ADMIN escreve), mas a lista
 * exige login. A coleta guarda o destino escolhido.
 */
describe('E2E: Destinos do leite', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let adminToken: string;
  let adminId: number;
  let vaqueiroToken: string;
  const suffix = `${Date.now()}`.slice(-6);

  const call = (method: 'get' | 'post' | 'put' | 'delete', path: string, token?: string, body?: object) => {
    const req = testApp.request()[method](path);
    if (token) req.set(authHelper.authHeader(token));
    return body ? req.send(body) : req;
  };

  const createDestination = async (name: string) =>
    (await call('post', '/destinations', adminToken, { name }).expect(HttpStatus.CREATED)).body.data
      .id as number;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const admin = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: `dest-admin-${suffix}@example.com`, password: 'Admin@1234' }),
    );
    adminToken = admin.token;
    adminId = admin.user.id!;

    const vaqueiro = UserFactory.build({
      email: `dest-vaq-${suffix}@example.com`,
      password: 'Vaq@12345',
      role: UserRole.VAQUEIRO,
    });
    await call('post', '/users/internal', adminToken, vaqueiro).expect(HttpStatus.CREATED);
    vaqueiroToken = await authHelper.login(vaqueiro.email!, vaqueiro.password!);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('permissões', () => {
    it('o ADMIN cria, edita e exclui', async () => {
      const id = await createDestination(`Laticínio ${suffix}`);

      const updated = await call('put', `/destinations/${id}`, adminToken, { description: 'Entrega diária' }).expect(
        HttpStatus.OK,
      );
      expect(updated.body.data.description).toBe('Entrega diária');

      await call('delete', `/destinations/${id}`, adminToken).expect(HttpStatus.OK);
      await call('get', `/destinations/${id}`, adminToken).expect(HttpStatus.NOT_FOUND);
    });

    it('o VAQUEIRO lista e consulta, mas não escreve', async () => {
      const id = await createDestination(`Consumo ${suffix}`);

      const list = await call('get', '/destinations', vaqueiroToken).expect(HttpStatus.OK);
      expect((list.body.data as { id: number }[]).some((d) => d.id === id)).toBe(true);
      await call('get', `/destinations/${id}`, vaqueiroToken).expect(HttpStatus.OK);

      await call('post', '/destinations', vaqueiroToken, { name: 'Invasor' }).expect(HttpStatus.FORBIDDEN);
      await call('put', `/destinations/${id}`, vaqueiroToken, { name: 'Trocado' }).expect(HttpStatus.FORBIDDEN);
      await call('delete', `/destinations/${id}`, vaqueiroToken).expect(HttpStatus.FORBIDDEN);
    });

    it('sem login nada funciona, nem a lista', async () => {
      await call('get', '/destinations').expect(HttpStatus.UNAUTHORIZED);
      await call('post', '/destinations', undefined, { name: 'Anonimo' }).expect(HttpStatus.UNAUTHORIZED);
      await call('delete', '/destinations/1').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('validações', () => {
    it('recusa nome repetido e nome vazio', async () => {
      await createDestination(`Bezerros ${suffix}`);

      await call('post', '/destinations', adminToken, { name: `Bezerros ${suffix}` }).expect(HttpStatus.BAD_REQUEST);
      await call('post', '/destinations', adminToken, { name: '' }).expect(HttpStatus.BAD_REQUEST);
    });

    it('recusa renomear para um nome que já existe', async () => {
      const a = await createDestination(`Dest A ${suffix}`);
      await createDestination(`Dest B ${suffix}`);

      await call('put', `/destinations/${a}`, adminToken, { name: `Dest B ${suffix}` }).expect(HttpStatus.BAD_REQUEST);
    });

    it('404 para destino inexistente', async () => {
      await call('get', '/destinations/999999', adminToken).expect(HttpStatus.NOT_FOUND);
      await call('put', '/destinations/999999', adminToken, { name: 'X' }).expect(HttpStatus.NOT_FOUND);
      await call('delete', '/destinations/999999', adminToken).expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('na coleta', () => {
    let animalId: number;

    beforeAll(async () => {
      const animals = testApp.getApp().get(AnimalsService);
      animalId = (await animals.create(AnimalFactory.build({ userId: adminId }) as never)).id as number;
    });

    const collection = (destinationId?: number) =>
      DailyCollectionFactory.build({
        userId: adminId,
        quantity: 10,
        items: [{ animalId, quantity: 10 }],
        ...(destinationId !== undefined ? { destinationId } : {}),
      } as never);

    it('guarda o destino escolhido e o devolve com o nome', async () => {
      const id = await createDestination(`Venda direta ${suffix}`);

      const created = await call('post', '/daily-collections', adminToken, collection(id)).expect(HttpStatus.CREATED);

      expect(created.body.data.destinationId).toBe(id);
      expect(created.body.data.destination).toEqual({ id, name: `Venda direta ${suffix}` });

      const fetched = await call('get', `/daily-collections/${created.body.data.id}`, adminToken).expect(HttpStatus.OK);
      expect(fetched.body.data.destination.name).toBe(`Venda direta ${suffix}`);
    });

    it('o destino continua opcional', async () => {
      const created = await call('post', '/daily-collections', adminToken, collection()).expect(HttpStatus.CREATED);

      expect(created.body.data.destinationId).toBeNull();
      expect(created.body.data.destination).toBeNull();
    });

    it('recusa destino que não existe', async () => {
      await call('post', '/daily-collections', adminToken, collection(999999)).expect(HttpStatus.NOT_FOUND);
    });

    it('não deixa excluir um destino já usado em coleta', async () => {
      const id = await createDestination(`Usado ${suffix}`);
      await call('post', '/daily-collections', adminToken, collection(id)).expect(HttpStatus.CREATED);

      const response = await call('delete', `/destinations/${id}`, adminToken);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(JSON.stringify(response.body)).toContain('usado em coletas');
      await call('get', `/destinations/${id}`, adminToken).expect(HttpStatus.OK);
    });
  });
});

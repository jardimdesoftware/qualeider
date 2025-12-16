import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { MilkingPlace } from '@/domain/enums/enums';
import { UserFactory, DailyCollectionFactory } from '../factories';

describe('E2E: Coletas Diárias - Operações CRUD', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let userToken: string;
  let userId: number;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const userData = UserFactory.buildProducer({
      email: 'producer@collections.com',
      password: 'Producer@1234',
    });

    const user = await authHelper.createUserAndLogin(userData);
    userToken = user.token;
    userId = user.user.id;
  });

  afterAll(async () => {
    await testApp.close();
    await teardownE2ETests();
  });

  describe('POST /daily-collections (Criar)', () => {
    it('deve criar uma nova coleta com dados válidos', async () => {
      const collectionData = DailyCollectionFactory.build({
        userId,
        quantity: 30,
        numAnimals: 6,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 2,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: true,
      });



      const response = await testApp
        .request()
        .post('/daily-collections')
        .send(collectionData)
        .expect(201);

      expect(response.body).toHaveProperty('statusCode', 201);
      expect(response.body).toHaveProperty(
        'message',
        'Coleta criada com sucesso',
      );
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.quantity).toBe(30);
      expect(response.body.data.numAnimals).toBe(6);
      expect(response.body.data.numOrdens).toBe(2);
      expect(response.body.data.rationProvided).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('deve criar coleta com assistência técnica', async () => {
      const collectionData = DailyCollectionFactory.buildWithAssistance({
        userId,
      });

      const response = await testApp
        .request()
        .post('/daily-collections')
        .send(collectionData)
        .expect(201);

      expect(response.body.data.technicalAssistance).toBe(true);
      expect(response.body.data.rationProvided).toBe(true);
    });

    it('deve criar coleta sem assistência técnica', async () => {
      const collectionData = DailyCollectionFactory.buildWithoutAssistance({
        userId,
      });

      const response = await testApp
        .request()
        .post('/daily-collections')
        .send(collectionData)
        .expect(201);

      expect(response.body.data.technicalAssistance).toBe(false);
      expect(response.body.data.rationProvided).toBe(false);
    });

    it('deve criar coleta em diferentes locais de ordenha', async () => {
      const places = [
        MilkingPlace.Curral,
        MilkingPlace.Aberto,
        MilkingPlace.Ambos,
      ];

      for (const place of places) {
        const collectionData = DailyCollectionFactory.build({
          userId,
          milkingPlace: place,
        });

        const response = await testApp
          .request()
          .post('/daily-collections')
          .send(collectionData)
          .expect(201);

        expect(response.body.data.milkingPlace).toBe(place);
      }
    });

    it('deve retornar 404 com userId inexistente', async () => {
      const collectionData = DailyCollectionFactory.build({
        userId: 99999,
      });

      await testApp
        .request()
        .post('/daily-collections')
        .send(collectionData)
        .expect(404);
    });

    it('deve retornar 400 com dados inválidos', async () => {
      await testApp
        .request()
        .post('/daily-collections')
        .send({
          quantity: -10,
          numAnimals: 'invalid',
          milkingPlace: 'INVALID_PLACE',
        })
        .expect(400);
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      await testApp.request().post('/daily-collections').send({}).expect(400);
    });
  });

  describe('GET /daily-collections (Listar)', () => {
    it('deve listar todas as coletas', async () => {
      const response = await testApp
        .request()
        .get('/daily-collections')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve filtrar coletas por userId', async () => {
      const response = await testApp
        .request()
        .get(`/daily-collections?userId=${userId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body).toEqual(
          expect.arrayContaining([expect.objectContaining({ userId })]),
        );
      }
    });

    it('deve filtrar coletas por intervalo de datas', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-12-31';

      const response = await testApp
        .request()
        .get(
          `/daily-collections?userId=${userId}&startDate=${startDate}&endDate=${endDate}`,
        )
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /daily-collections/:id (Buscar por ID)', () => {
    it('deve buscar coleta por ID', async () => {
      const collectionData = DailyCollectionFactory.build({ userId });
      const created = await testApp
        .request()
        .post('/daily-collections')
        .send(collectionData)
        .expect(201);

      const collectionId = created.body.data.id;

      const response = await testApp
        .request()
        .get(`/daily-collections/${collectionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', collectionId);
      expect(response.body).toHaveProperty('userId', userId);
    });

    it('deve retornar 404 ao buscar ID inexistente', async () => {
      await testApp.request().get('/daily-collections/99999').expect(404);
    });
  });

  describe('PUT /daily-collections/:id (Atualizar)', () => {
    it('deve atualizar coleta com dados válidos', async () => {
      const collectionData = DailyCollectionFactory.build({
        userId,
        quantity: 20,
      });
      const created = await testApp
        .request()
        .post('/daily-collections')
        .send(collectionData)
        .expect(201);

      const collectionId = created.body.data.id;

      const response = await testApp
        .request()
        .put(`/daily-collections/${collectionId}`)
        .send({
          quantity: 35,
          numAnimals: 8,
        })
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty(
        'message',
        'Coleta atualizada com sucesso',
      );
      expect(response.body.data.quantity).toBe(35);
      expect(response.body.data.numAnimals).toBe(8);
    });

    it('deve retornar 404 ao atualizar ID inexistente', async () => {
      await testApp
        .request()
        .put('/daily-collections/99999')
        .send({ quantity: 30 })
        .expect(404);
    });
  });

  describe('DELETE /daily-collections/:id (Deletar)', () => {
    it('deve deletar coleta com sucesso', async () => {
      const collectionData = DailyCollectionFactory.build({
        userId,
      });
      const created = await testApp
        .request()
        .post('/daily-collections')
        .send(collectionData)
        .expect(201);

      const collectionId = created.body.data.id;

      const response = await testApp
        .request()
        .delete(`/daily-collections/${collectionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty(
        'message',
        'Coleta excluída com sucesso',
      );

      await testApp
        .request()
        .get(`/daily-collections/${collectionId}`)
        .expect(404);
    });

    it('deve retornar 404 ao deletar ID inexistente', async () => {
      await testApp.request().delete('/daily-collections/99999').expect(404);
    });
  });
});

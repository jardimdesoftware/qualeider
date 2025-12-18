import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AnimalType } from '@/domain/enums/enums';
import { UserFactory, AnimalFactory } from '../factories';

describe('E2E: Animais - Operações CRUD', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let userId: number;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const userData = UserFactory.buildProducer({
      email: 'producer@animals.com',
      password: 'Producer@1234',
    });

    const user = await authHelper.createUserAndLogin(userData);
    userId = user!.user!.id!;
  });

  afterAll(async () => {
    await testApp.close();
    await teardownE2ETests();
  });

  describe('POST /animals (Criar)', () => {
    it('deve criar um novo animal com dados válidos', async () => {
      const animalData = AnimalFactory.build({
        userId,
        name: 'Mimosa',
        animalType: AnimalType.Vaca,
        breed: 'Holandês',
        age: 5,
      });

      const response = await testApp
        .request()
        .post('/animals')
        .send(animalData)
        .expect(201);

      expect(response.body).toHaveProperty('statusCode', 201);
      expect(response.body).toHaveProperty(
        'message',
        'Animal criado com sucesso',
      );

      const data = response.body.data;
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('Mimosa');
      expect(data.animalType).toBe(AnimalType.Vaca);
      expect(data.breed).toBe('Holandês');
      expect(data.age).toBe(5);
      expect(data.userId).toBe(userId);
    });

    it('deve criar animal sem nome (opcional)', async () => {
      const animalData = AnimalFactory.build({
        userId,
        animalType: AnimalType.Cabra,
        breed: 'Saanen',
        age: 3,
      });
      delete animalData.name;

      const response = await testApp
        .request()
        .post('/animals')
        .send(animalData)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.animalType).toBe(AnimalType.Cabra);
    });

    it('deve retornar 404 com userId inexistente (EntityNotFound)', async () => {
      const animalData = AnimalFactory.build({
        userId: 99999,
      });

      const response = await testApp
        .request()
        .post('/animals')
        .send(animalData)
        .expect(404);

      expect(response.body.message[0]).toContain('não encontrado');
    });

    it('deve retornar 400 com dados inválidos', async () => {
      await testApp
        .request()
        .post('/animals')
        .send({
          animalType: 'INVALID_TYPE',
          breed: '',
          age: -1,
        })
        .expect(400);
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      await testApp.request().post('/animals').send({}).expect(400);
    });
  });

  describe('GET /animals (Listar)', () => {
    it('deve listar todos os animais (Array direto)', async () => {
      const response = await testApp.request().get('/animals').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve filtrar animais por userId', async () => {
      const response = await testApp
        .request()
        .get(`/animals?userId=${userId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body).toEqual(
          expect.arrayContaining([expect.objectContaining({ userId })]),
        );
      }
    });

    it('deve filtrar animais por tipo', async () => {
      const response = await testApp
        .request()
        .get(`/animals?animalType=${AnimalType.Vaca}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ animalType: AnimalType.Vaca }),
          ]),
        );
      }
    });
  });

  describe('GET /animals/:id (Buscar por ID)', () => {
    it('deve buscar animal por ID (Objeto direto)', async () => {
      const animalData = AnimalFactory.buildVaca({ userId });
      const created = await testApp
        .request()
        .post('/animals')
        .send(animalData)
        .expect(201);

      const animalId = created.body.data.id;

      const response = await testApp
        .request()
        .get(`/animals/${animalId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', animalId);
      expect(response.body).toHaveProperty('animalType', AnimalType.Vaca);
    });

    it('deve retornar 404 ao buscar ID inexistente', async () => {
      await testApp.request().get('/animals/99999').expect(404);
    });
  });

  describe('PUT /animals/:id (Atualizar)', () => {
    it('deve atualizar animal com dados válidos', async () => {
      const animalData = AnimalFactory.build({
        userId,
        name: 'Antes',
        age: 3,
      });
      const created = await testApp
        .request()
        .post('/animals')
        .send(animalData)
        .expect(201);

      const animalId = created.body.data.id;

      const response = await testApp
        .request()
        .put(`/animals/${animalId}`)
        .send({
          name: 'Depois',
          age: 4,
        })
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty(
        'message',
        'Animal atualizado com sucesso',
      );
      expect(response.body.data.name).toBe('Depois');
      expect(response.body.data.age).toBe(4);
    });

    it('deve retornar 404 ao atualizar ID inexistente', async () => {
      await testApp
        .request()
        .put('/animals/99999')
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /animals/:id (Deletar)', () => {
    it('deve fazer soft delete de animal', async () => {
      const animalData = AnimalFactory.build({
        userId,
        name: 'Para Deletar',
      });
      const created = await testApp
        .request()
        .post('/animals')
        .send(animalData)
        .expect(201);

      const animalId = created.body.data.id;

      const response = await testApp
        .request()
        .delete(`/animals/${animalId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', animalId);
      expect(response.body).toHaveProperty('status', 'Inactive');

      const getResponse = await testApp
        .request()
        .get(`/animals/${animalId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('status', 'Inactive');
    });

    it('deve retornar 404 ao deletar ID inexistente', async () => {
      await testApp.request().delete('/animals/99999').expect(404);
    });
  });
});

import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AnimalType } from '@/domain/enums/enums';
import { UserFactory, AnimalFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

describe('E2E: Animais - Operações CRUD', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let userId: number;
  let userToken: string;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const userData = UserFactory.buildProducer({
      email: 'producer@animals.com',
      password: 'Producer@1234',
    });

    const loginResult = await authHelper.createUserAndLogin(userData);
    userId = loginResult.user.id!;
    userToken = loginResult.token; 
  });

  afterAll(async () => {
    if (testApp) await testApp.close();
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
        .set('Authorization', `Bearer ${userToken}`)
        .send(animalData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.CREATED);
      expect(response.body).toHaveProperty('message', 'Animal criado com sucesso');

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
        .set('Authorization', `Bearer ${userToken}`)
        .send(animalData)
        .expect(HttpStatus.CREATED);

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
        .set('Authorization', `Bearer ${userToken}`)
        .send(animalData)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toContain('Usuário com ID 99999 não encontrado.'); 
    });

    it('deve retornar 400 com dados inválidos', async () => {
      await testApp
        .request()
        .post('/animals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          animalType: 'INVALID_TYPE',
          breed: '',
          age: -1,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      await testApp
        .request()
        .post('/animals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /animals (Listar)', () => {
    it('deve listar todos os animais com estrutura paginada', async () => {
      const response = await testApp
        .request()
        .get('/animals')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('deve filtrar animais por userId', async () => {
      const response = await testApp
        .request()
        .get(`/animals?userId=${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      
      const lista = response.body.data;
      expect(Array.isArray(lista)).toBe(true);
      
      if (lista.length > 0) {
        expect(lista).toEqual(
          expect.arrayContaining([expect.objectContaining({ userId })]),
        );
      }
    });

    it('deve filtrar animais por tipo', async () => {
      const response = await testApp
        .request()
        .get(`/animals?animalType=${AnimalType.Vaca}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      
      const lista = response.body.data;
      expect(Array.isArray(lista)).toBe(true);
      
      if (lista.length > 0) {
        expect(lista).toEqual(
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
        .set('Authorization', `Bearer ${userToken}`)
        .send(animalData)
        .expect(HttpStatus.CREATED);

      const animalId = created.body.data.id;

      const response = await testApp
        .request()
        .get(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toHaveProperty('id', animalId);
      expect(response.body.data).toHaveProperty('animalType', AnimalType.Vaca);
    });

    it('deve retornar 404 ao buscar ID inexistente', async () => {
      await testApp
        .request()
        .get('/animals/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NOT_FOUND);
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
        .set('Authorization', `Bearer ${userToken}`)
        .send(animalData)
        .expect(HttpStatus.CREATED);

      const animalId = created.body.data.id;

      const response = await testApp
        .request()
        .put(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Depois',
          age: 4,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.OK);
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
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test' })
        .expect(HttpStatus.NOT_FOUND);
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
        .set('Authorization', `Bearer ${userToken}`)
        .send(animalData)
        .expect(HttpStatus.CREATED);

      const animalId = created.body.data.id;

      const response = await testApp
        .request()
        .delete(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toHaveProperty('id', animalId);
      expect(response.body.data).toHaveProperty('status', 'Inactive');

      const getResponse = await testApp
        .request()
        .get(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.data).toHaveProperty('status', 'Inactive');
    });

    it('deve retornar 404 ao deletar ID inexistente', async () => {
      await testApp
        .request()
        .delete('/animals/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
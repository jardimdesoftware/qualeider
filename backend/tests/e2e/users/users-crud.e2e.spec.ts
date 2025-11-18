import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserCategory } from '@/domain/enums/enums';
import { UserFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

describe('E2E: Users - CRUD Operations', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const adminData = UserFactory.buildAdmin({
      email: 'admin@example.com',
      password: 'Admin@1234',
    });
    const admin = await authHelper.createUserAndLogin(adminData);
    adminToken = admin.token;

    const userData = UserFactory.buildProducer({
      email: 'user@example.com',
      password: 'User@1234',
    });
    const user = await authHelper.createUserAndLogin(userData);
    userToken = user.token;
  });

  afterAll(async () => {
    await testApp.close();
    await teardownE2ETests();
  });

  describe('POST /users (Create)', () => {
    it('deve criar um novo usuário com dados válidos', async () => {
      const newUserData = UserFactory.build({
        email: 'newuser@example.com',
        password: 'NewUser@1234',
        name: 'New User',
        city: 'Curitiba',
        state: 'PR',
      });

      const response = await testApp
        .request()
        .post('/users')
        .send(newUserData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.CREATED);
      expect(response.body).toHaveProperty(
        'message',
        'Usuário criado com sucesso',
      );

      const data = response.body.data;
      expect(data).toHaveProperty('id');
      expect(data.email).toBe('newuser@example.com');
      expect(data.name).toBe('New User');
      expect(data.userCategory).toBe(UserCategory.Fisica);
      expect(data).not.toHaveProperty('password');
    });

    it('deve retornar 409 com email duplicado', async () => {
      const duplicateData = UserFactory.build({
        email: 'admin@example.com',
      });

      await testApp
        .request()
        .post('/users')
        .send(duplicateData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 com dados inválidos', async () => {
      await testApp
        .request()
        .post('/users')
        .send({
          email: 'invalid-email',
          password: '123',
          name: '',
          userCategory: 'INVALID',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      await testApp
        .request()
        .post('/users')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /users (List)', () => {
    it('deve listar usuários com autenticação (Array direto)', async () => {
      const response = await testApp
        .request()
        .get('/users')
        .set(authHelper.authHeader(adminToken))
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('deve retornar 401 sem token de autenticação', async () => {
      await testApp.request().get('/users').expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar 401 com token inválido', async () => {
      await testApp
        .request()
        .get('/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /users/:id (Find One)', () => {
    it('deve buscar usuário por ID com autenticação', async () => {
      const created = await testApp
        .request()
        .post('/users')
        .send({
          email: 'findone@example.com',
          password: 'Test@1234',
          name: 'Find One User',
          userCategory: UserCategory.Fisica,
          city: 'Brasília',
          state: 'DF',
        })
        .expect(HttpStatus.CREATED);

      const userId = created.body.data.id;

      const response = await testApp
        .request()
        .get(`/users/${userId}`)
        .set(authHelper.authHeader(adminToken))
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe('findone@example.com');
      expect(response.body.name).toBe('Find One User');
      expect(response.body).not.toHaveProperty('password');
    });

    it('deve retornar 404 com ID inexistente', async () => {
      await testApp
        .request()
        .get('/users/99999')
        .set(authHelper.authHeader(adminToken))
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await testApp.request().get('/users/1').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /users/:id (Update)', () => {
    it('deve atualizar usuário com dados válidos', async () => {
      const createData = UserFactory.build({
        email: 'update@example.com',
        name: 'Update User',
        city: 'Porto Alegre',
        state: 'RS',
      });

      const created = await testApp
        .request()
        .post('/users')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const userId = created.body.data.id;

      const response = await testApp
        .request()
        .put(`/users/${userId}`)
        .set(authHelper.authHeader(adminToken))
        .send({
          name: 'Updated Name',
          city: 'Florianópolis',
          state: 'SC',
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.OK);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.city).toBe('Florianópolis');
      expect(response.body.data.state).toBe('SC');
      expect(response.body.data.email).toBe('update@example.com');
    });

    it('deve retornar 404 ao atualizar ID inexistente', async () => {
      await testApp
        .request()
        .put('/users/99999')
        .set(authHelper.authHeader(adminToken))
        .send({ name: 'Updated' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await testApp
        .request()
        .put('/users/1')
        .send({ name: 'Test' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar 400 (BusinessException) com email duplicado', async () => {
      const createData = UserFactory.build({
        email: 'unique@example.com',
        name: 'Unique User',
        city: 'Salvador',
        state: 'BA',
      });

      const created = await testApp
        .request()
        .post('/users')
        .send(createData)
        .expect(HttpStatus.CREATED);

      await testApp
        .request()
        .put(`/users/${created.body.data.id}`)
        .set(authHelper.authHeader(adminToken))
        .send({
          email: 'admin@example.com',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /users/:id (Soft Delete)', () => {
    it('deve fazer soft delete de usuário', async () => {
      const deleteData = UserFactory.build({
        email: 'delete@example.com',
        name: 'Delete User',
        city: 'Recife',
        state: 'PE',
      });

      const created = await testApp
        .request()
        .post('/users')
        .send(deleteData)
        .expect(HttpStatus.CREATED);

      const userId = created.body.data.id;

      const response = await testApp
        .request()
        .delete(`/users/${userId}`)
        .set(authHelper.authHeader(adminToken))
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.OK);
      expect(response.body.data.status).toBe('Inactive');
    });

    it('deve retornar 404 ao deletar ID inexistente', async () => {
      await testApp
        .request()
        .delete('/users/99999')
        .set(authHelper.authHeader(adminToken))
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await testApp
        .request()
        .delete('/users/1')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Fluxo completo (Create → Read → Update → Delete)', () => {
    it('deve executar CRUD completo com sucesso', async () => {
      const created = await testApp
        .request()
        .post('/users')
        .send({
          email: 'fullcrud@example.com',
          password: 'FullCRUD@1234',
          name: 'Full CRUD User',
          userCategory: UserCategory.Fisica,
          city: 'Belo Horizonte',
          state: 'MG',
        })
        .expect(HttpStatus.CREATED);

      const userId = created.body.data.id;

      const found = await testApp
        .request()
        .get(`/users/${userId}`)
        .set(authHelper.authHeader(adminToken))
        .expect(HttpStatus.OK);

      expect(found.body.email).toBe('fullcrud@example.com');
      expect(found.body.name).toBe('Full CRUD User');

      const updated = await testApp
        .request()
        .put(`/users/${userId}`)
        .set(authHelper.authHeader(adminToken))
        .send({
          name: 'Updated Full CRUD User',
          city: 'Campinas',
        })
        .expect(HttpStatus.OK);

      expect(updated.body.data.name).toBe('Updated Full CRUD User');
      expect(updated.body.data.city).toBe('Campinas');

      await testApp
        .request()
        .delete(`/users/${userId}`)
        .set(authHelper.authHeader(adminToken))
        .expect(HttpStatus.OK);
    });
  });
});

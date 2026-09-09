import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserCategory, UserRole, Status } from '@/domain/enums/enums';
import { UserFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

describe('E2E: Users - CRUD Operations', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let adminToken: string;
  // Segundo ADMIN (tenant/fazenda diferente) - usado para provar isolamento
  // cross-tenant (regressao da correcao de escalada de privilegio).
  let admin2Token: string;
  // VAQUEIRO vinculado ao admin principal (adminToken) via POST /users/internal.
  let vaqueiroToken: string;
  let vaqueiroId: number;

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
    await authHelper.createUserAndLogin(userData);

    const admin2Data = UserFactory.buildAdmin({
      email: 'admin2@example.com',
      password: 'Admin2@1234',
    });
    const admin2 = await authHelper.createUserAndLogin(admin2Data);
    admin2Token = admin2.token;

    const vaqueiroData = UserFactory.build({
      email: 'vaqueiro@example.com',
      password: 'Vaqueiro@1234',
      role: UserRole.VAQUEIRO,
    });
    const vaqueiroCreated = await testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(adminToken))
      .send(vaqueiroData)
      .expect(HttpStatus.CREATED);
    vaqueiroId = vaqueiroCreated.body.data.id;
    vaqueiroToken = await authHelper.login(
      vaqueiroData.email!,
      vaqueiroData.password!,
    );
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
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

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).not.toHaveProperty('password');
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

    it('deve retornar 403 quando quem pede é VAQUEIRO (não-admin)', async () => {
      await testApp
        .request()
        .get('/users')
        .set(authHelper.authHeader(vaqueiroToken))
        .expect(HttpStatus.FORBIDDEN);
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

      expect(response.body.data).toHaveProperty('id', userId);
      expect(response.body.data).toHaveProperty('email', 'findone@example.com');
      expect(response.body.data).toHaveProperty('name', 'Find One User');
      expect(response.body.data).not.toHaveProperty('password');
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

    it('deve retornar 403 quando quem pede é VAQUEIRO (não-admin)', async () => {
      await testApp
        .request()
        .get(`/users/${vaqueiroId}`)
        .set(authHelper.authHeader(vaqueiroToken))
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('POST /users/internal (Criação interna de funcionário)', () => {
    it('deve retornar 403 quando quem cria não é ADMIN', async () => {
      const newVaqueiroData = UserFactory.build({
        email: 'nao-deveria-existir@example.com',
        role: UserRole.VAQUEIRO,
      });

      await testApp
        .request()
        .post('/users/internal')
        .set(authHelper.authHeader(vaqueiroToken))
        .send(newVaqueiroData)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const newVaqueiroData = UserFactory.build({ role: UserRole.VAQUEIRO });

      await testApp
        .request()
        .post('/users/internal')
        .send(newVaqueiroData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /users/:id (Update)', () => {
    /**
     * Correcao da escalada de privilegio: PUT/PATCH /users/:id agora exige
     * que o requisitante seja ADMIN e gerencie o usuario alvo (mesma
     * associacao ou funcionario vinculado via adminId). Por isso os
     * "funcionarios" editados aqui precisam ser criados via POST
     * /users/internal (autenticado como adminToken), que vincula o novo
     * usuario ao admin criador via adminId - e nao mais via POST /users
     * publico, que sempre cria uma conta ADMIN independente.
     */
    it('deve atualizar usuário com dados válidos', async () => {
      const createData = UserFactory.build({
        email: 'update@example.com',
        name: 'Update User',
        city: 'Porto Alegre',
        state: 'RS',
        role: UserRole.VAQUEIRO,
      });

      const created = await testApp
        .request()
        .post('/users/internal')
        .set(authHelper.authHeader(adminToken))
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

    it('regressão IDOR: deve retornar 403 quando VAQUEIRO tenta editar outro usuário', async () => {
      await testApp
        .request()
        .put(`/users/${vaqueiroId}`)
        .set(authHelper.authHeader(vaqueiroToken))
        .send({ name: 'Tentativa de edição' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('regressão IDOR: deve retornar 403 quando ADMIN tenta editar funcionário de outro ADMIN (cross-tenant)', async () => {
      await testApp
        .request()
        .put(`/users/${vaqueiroId}`)
        .set(authHelper.authHeader(admin2Token))
        .send({ name: 'Tentativa de edição cross-tenant' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('deve retornar 400 (BusinessException) com email duplicado', async () => {
      const createData = UserFactory.build({
        email: 'unique@example.com',
        name: 'Unique User',
        city: 'Salvador',
        state: 'BA',
        role: UserRole.VAQUEIRO,
      });

      const created = await testApp
        .request()
        .post('/users/internal')
        .set(authHelper.authHeader(adminToken))
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

    it('regressão #166: deve permitir reenviar o proprio email do usuario ao editar outros campos', async () => {
      const createData = UserFactory.build({
        email: 'mesmo-email@example.com',
        name: 'Nome Original',
        city: 'Recife',
        state: 'PE',
        role: UserRole.VAQUEIRO,
      });

      const created = await testApp
        .request()
        .post('/users/internal')
        .set(authHelper.authHeader(adminToken))
        .send(createData)
        .expect(HttpStatus.CREATED);

      const response = await testApp
        .request()
        .put(`/users/${created.body.data.id}`)
        .set(authHelper.authHeader(adminToken))
        .send({
          name: 'Nome Atualizado',
          email: 'mesmo-email@example.com',
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.name).toBe('Nome Atualizado');
      expect(response.body.data.email).toBe('mesmo-email@example.com');
    });

    it('regressão #167: deve permitir inativar um funcionário via update', async () => {
      const createData = UserFactory.build({
        email: 'inativar-update@example.com',
        role: UserRole.VAQUEIRO,
      });

      const created = await testApp
        .request()
        .post('/users/internal')
        .set(authHelper.authHeader(adminToken))
        .send(createData)
        .expect(HttpStatus.CREATED);

      const response = await testApp
        .request()
        .put(`/users/${created.body.data.id}`)
        .set(authHelper.authHeader(adminToken))
        .send({ status: Status.Inactive })
        .expect(HttpStatus.OK);

      expect(response.body.data.status).toBe(Status.Inactive);
    });

    it('regressão #167: deve permitir reativar um funcionário previamente inativado', async () => {
      const createData = UserFactory.build({
        email: 'reativar-update@example.com',
        role: UserRole.VAQUEIRO,
      });

      const created = await testApp
        .request()
        .post('/users/internal')
        .set(authHelper.authHeader(adminToken))
        .send(createData)
        .expect(HttpStatus.CREATED);

      const userId = created.body.data.id;

      await testApp
        .request()
        .put(`/users/${userId}`)
        .set(authHelper.authHeader(adminToken))
        .send({ status: Status.Inactive })
        .expect(HttpStatus.OK);

      const reactivated = await testApp
        .request()
        .put(`/users/${userId}`)
        .set(authHelper.authHeader(adminToken))
        .send({ status: Status.Active })
        .expect(HttpStatus.OK);

      expect(reactivated.body.data.status).toBe(Status.Active);
    });

    it('deve permitir alterar o cargo/perfil (role) de um funcionário', async () => {
      const createData = UserFactory.build({
        email: 'trocar-role@example.com',
        role: UserRole.VAQUEIRO,
      });

      const created = await testApp
        .request()
        .post('/users/internal')
        .set(authHelper.authHeader(adminToken))
        .send(createData)
        .expect(HttpStatus.CREATED);

      const response = await testApp
        .request()
        .put(`/users/${created.body.data.id}`)
        .set(authHelper.authHeader(adminToken))
        .send({ role: UserRole.VAQUEIRO })
        .expect(HttpStatus.OK);

      expect(response.body.data.role).toBe(UserRole.VAQUEIRO);
    });
  });

  describe('PATCH /users/:id (Atualização parcial)', () => {
    it('deve atualizar parcialmente um usuário com dados válidos', async () => {
      const createData = UserFactory.build({
        email: 'patch@example.com',
        role: UserRole.VAQUEIRO,
      });

      const created = await testApp
        .request()
        .post('/users/internal')
        .set(authHelper.authHeader(adminToken))
        .send(createData)
        .expect(HttpStatus.CREATED);

      const response = await testApp
        .request()
        .patch(`/users/${created.body.data.id}`)
        .set(authHelper.authHeader(adminToken))
        .send({ city: 'Fortaleza' })
        .expect(HttpStatus.OK);

      expect(response.body.data.city).toBe('Fortaleza');
    });

    it('deve retornar 404 ao atualizar ID inexistente', async () => {
      await testApp
        .request()
        .patch('/users/99999')
        .set(authHelper.authHeader(adminToken))
        .send({ city: 'Teste' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await testApp
        .request()
        .patch('/users/1')
        .send({ city: 'Teste' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('regressão IDOR: deve retornar 403 quando VAQUEIRO tenta editar outro usuário', async () => {
      await testApp
        .request()
        .patch(`/users/${vaqueiroId}`)
        .set(authHelper.authHeader(vaqueiroToken))
        .send({ city: 'Tentativa de edição' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('regressão IDOR: deve retornar 403 quando ADMIN tenta editar funcionário de outro ADMIN (cross-tenant)', async () => {
      await testApp
        .request()
        .patch(`/users/${vaqueiroId}`)
        .set(authHelper.authHeader(admin2Token))
        .send({ city: 'Tentativa de edição cross-tenant' })
        .expect(HttpStatus.FORBIDDEN);
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

    it('deve retornar 403 quando quem pede é VAQUEIRO (não-admin)', async () => {
      await testApp
        .request()
        .delete(`/users/${vaqueiroId}`)
        .set(authHelper.authHeader(vaqueiroToken))
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('Fluxo completo (Create → Read → Update → Delete)', () => {
    it('deve executar CRUD completo com sucesso', async () => {
      const created = await testApp
        .request()
        .post('/users/internal')
        .set(authHelper.authHeader(adminToken))
        .send({
          email: 'fullcrud@example.com',
          password: 'FullCRUD@1234',
          name: 'Full CRUD User',
          userCategory: UserCategory.Fisica,
          city: 'Belo Horizonte',
          state: 'MG',
          role: UserRole.VAQUEIRO,
        })
        .expect(HttpStatus.CREATED);

      const userId = created.body.data.id;

      const found = await testApp
        .request()
        .get(`/users/${userId}`)
        .set(authHelper.authHeader(adminToken))
        .expect(HttpStatus.OK);

      expect(found.body.data).toHaveProperty('email', 'fullcrud@example.com');
      expect(found.body.data).toHaveProperty('name', 'Full CRUD User');

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

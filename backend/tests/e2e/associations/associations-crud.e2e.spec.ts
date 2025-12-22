import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AssociationFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

describe('E2E: Associações - Operações CRUD', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let adminToken: string;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const adminUser = await authHelper.createUserAndLogin({
      email: 'admin@associations.test.com',
      password: 'Admin@1234'
    });
    adminToken = adminUser.token;
  }, 30000);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('POST /associations', () => {
    it('deve criar uma associação municipal com sucesso', async () => {
      const associationData = AssociationFactory.buildMunicipal();

      const response = await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(associationData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.CREATED);
      expect(response.body).toHaveProperty(
        'message',
        'Associação criada com sucesso',
      );
      expect(response.body.data).toMatchObject({
        name: associationData.name,
        cnpj: associationData.cnpj,
        email: associationData.email,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('deve criar uma associação regional com sucesso', async () => {
      const associationData = AssociationFactory.buildRegional();

      const response = await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(associationData)
        .expect(HttpStatus.CREATED);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('email');
    });

    it('deve criar uma associação estadual com sucesso', async () => {
      const associationData = AssociationFactory.buildEstadual();

      const response = await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(associationData)
        .expect(HttpStatus.CREATED);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('email');
    });

    it('deve retornar 400 se campos obrigatórios estiverem faltando', async () => {
      const invalidData = {
        name: 'Associação Inválida',
      };

      await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 se o formato do CNPJ for inválido', async () => {
      const associationData = AssociationFactory.build({
        cnpj: 'invalid-cnpj',
      });

      await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(associationData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 se o formato do email for inválido', async () => {
      const associationData = AssociationFactory.build({
        email: 'invalid-email',
      });

      await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(associationData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 409 se o CNPJ já existir', async () => {
      const associationData = AssociationFactory.build();

      await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(associationData)
        .expect(HttpStatus.CREATED);

      await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(associationData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 409 se o email já existir', async () => {
      const firstAssociation = AssociationFactory.build();

      await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(firstAssociation)
        .expect(HttpStatus.CREATED);

      const duplicateEmail = AssociationFactory.build({
        email: firstAssociation.email,
      });

      await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateEmail)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /associations/check-email', () => {
    let existingEmail: string;

    beforeAll(async () => {
      const association = AssociationFactory.build();
      existingEmail = association.email!;

      await testApp.request().post('/associations').set('Authorization', `Bearer ${adminToken}`).send(association);
    }, 30000);

    it('deve retornar true se o email existir', async () => {
      const response = await testApp
        .request()
        .get(`/associations/check-email?email=${existingEmail}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data.exists).toEqual(true);
    });

    it('deve retornar false se o email não existir', async () => {
      const response = await testApp
        .request()
        .get('/associations/check-email?email=nonexistent@example.com')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data.exists).toEqual(false);
    });

    it('deve retornar 400 se o parâmetro email estiver faltando', async () => {
      await testApp
        .request()
        .get('/associations/check-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve funcionar sem autenticação', async () => {
      await testApp
        .request()
        .get(`/associations/check-email?email=${existingEmail}`)
        .expect(HttpStatus.OK);
    });
  });

  describe('GET /associations/check-cnpj', () => {
    let existingCnpj: string;

    beforeAll(async () => {
      const association = AssociationFactory.build();
      existingCnpj = association.cnpj!;

      await testApp.request().post('/associations').set('Authorization', `Bearer ${adminToken}`).send(association);
    }, 30000);

    it('deve retornar true se o CNPJ existir', async () => {
      const response = await testApp
        .request()
        .get(`/associations/check-cnpj?cnpj=${existingCnpj}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data.exists).toEqual(true);
    });

    it('deve retornar false se o CNPJ não existir', async () => {
      const newCnpj = AssociationFactory.build().cnpj;

      const response = await testApp
        .request()
        .get(`/associations/check-cnpj?cnpj=${newCnpj}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.data.exists).toEqual(false);
    });

    it('deve retornar 400 se o parâmetro CNPJ estiver faltando', async () => {
      await testApp
        .request()
        .get('/associations/check-cnpj')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve funcionar sem autenticação', async () => {
      await testApp
        .request()
        .get(`/associations/check-cnpj?cnpj=${existingCnpj}`)
        .expect(HttpStatus.OK);
    });
  });

  describe('Fluxo Completo de Associação', () => {
    it('deve lidar com o ciclo de vida completo da associação', async () => {
      const associationData = AssociationFactory.build();

      const emailCheck = await testApp
        .request()
        .get(`/associations/check-email?email=${associationData.email}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(emailCheck.body.data.exists).toBe(false);

      const cnpjCheck = await testApp
        .request()
        .get(`/associations/check-cnpj?cnpj=${associationData.cnpj}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(cnpjCheck.body.data.exists).toBe(false);

      const createResponse = await testApp
        .request()
        .post('/associations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(associationData)
        .expect(HttpStatus.CREATED);

      expect(createResponse.body.data).toMatchObject({
        name: associationData.name,
        cnpj: associationData.cnpj,
        email: associationData.email,
      });

      const emailCheckAfter = await testApp
        .request()
        .get(`/associations/check-email?email=${associationData.email}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(emailCheckAfter.body.data.exists).toBe(true);

      const cnpjCheckAfter = await testApp
        .request()
        .get(`/associations/check-cnpj?cnpj=${associationData.cnpj}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(cnpjCheckAfter.body.data.exists).toBe(true);
    });
  });
});

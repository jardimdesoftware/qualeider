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

    const adminUser = await authHelper.createUserAndLogin();
    adminToken = adminUser.token;
  });

  afterAll(async () => {
    await testApp.close();
    await teardownE2ETests();
  });

  describe('POST /associations', () => {
    it('deve criar uma associação municipal com sucesso', async () => {
      const associationData = AssociationFactory.buildMunicipal();

      const response = await testApp
        .request()
        .post('/associations')
        .send(associationData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        name: associationData.name,
        cnpj: associationData.cnpj,
        email: associationData.email,
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).not.toHaveProperty('password');
    });

    it('deve criar uma associação regional com sucesso', async () => {
      const associationData = AssociationFactory.buildRegional();

      const response = await testApp
        .request()
        .post('/associations')
        .send(associationData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
    });

    it('deve criar uma associação estadual com sucesso', async () => {
      const associationData = AssociationFactory.buildEstadual();

      const response = await testApp
        .request()
        .post('/associations')
        .send(associationData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
    });

    it('deve retornar 400 se campos obrigatórios estiverem faltando', async () => {
      const invalidData = {
        name: 'Associação Inválida',
      };

      await testApp
        .request()
        .post('/associations')
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
        .send(associationData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 409 se o CNPJ já existir', async () => {
      const associationData = AssociationFactory.build();

      // Criar primeira associação
      await testApp
        .request()
        .post('/associations')
        .send(associationData)
        .expect(HttpStatus.CREATED);

      // Tentar criar duplicado
      await testApp
        .request()
        .post('/associations')
        .send(associationData)
        .expect(HttpStatus.CONFLICT);
    });

    it('deve retornar 409 se o email já existir', async () => {
      const firstAssociation = AssociationFactory.build();

      await testApp
        .request()
        .post('/associations')
        .send(firstAssociation)
        .expect(HttpStatus.CREATED);

      // Tentar criar com mesmo email mas CNPJ diferente
      const duplicateEmail = AssociationFactory.build({
        email: firstAssociation.email,
      });

      await testApp
        .request()
        .post('/associations')
        .send(duplicateEmail)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('GET /associations/check-email', () => {
    let existingEmail: string;

    beforeAll(async () => {
      const association = AssociationFactory.build();
      existingEmail = association.email;

      await testApp.request().post('/associations').send(association);
    });

    it('deve retornar true se o email existir', async () => {
      const response = await testApp
        .request()
        .get(`/associations/check-email?email=${existingEmail}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ exists: true });
    });

    it('deve retornar false se o email não existir', async () => {
      const response = await testApp
        .request()
        .get('/associations/check-email?email=nonexistent@example.com')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ exists: false });
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
      existingCnpj = association.cnpj;

      await testApp.request().post('/associations').send(association);
    });

    it('deve retornar true se o CNPJ existir', async () => {
      const response = await testApp
        .request()
        .get(`/associations/check-cnpj?cnpj=${existingCnpj}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ exists: true });
    });

    it('deve retornar false se o CNPJ não existir', async () => {
      const newCnpj = AssociationFactory.build().cnpj;

      const response = await testApp
        .request()
        .get(`/associations/check-cnpj?cnpj=${newCnpj}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ exists: false });
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

  describe('Validação de Área de Cobertura', () => {
    it('deve aceitar área de cobertura Municipal', async () => {
      const association = AssociationFactory.buildMunicipal();

      const response = await testApp
        .request()
        .post('/associations')
        .send(association)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
    });

    it('deve aceitar área de cobertura Regional', async () => {
      const association = AssociationFactory.buildRegional();

      const response = await testApp
        .request()
        .post('/associations')
        .send(association)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
    });

    it('deve aceitar área de cobertura Estadual', async () => {
      const association = AssociationFactory.buildEstadual();

      const response = await testApp
        .request()
        .post('/associations')
        .send(association)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
    });

    it('deve retornar 400 para área de cobertura inválida', async () => {
      const association = AssociationFactory.build({
        coverageArea: 'Invalid' as any,
      });

      await testApp
        .request()
        .post('/associations')
        .send(association)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Fluxo Completo de Associação', () => {
    it('deve lidar com o ciclo de vida completo da associação: verificar disponibilidade → criar → verificar', async () => {
      const associationData = AssociationFactory.build();

      // 1. Verificar se email está disponível
      const emailCheck = await testApp
        .request()
        .get(`/associations/check-email?email=${associationData.email}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(emailCheck.body.exists).toBe(false);

      // 2. Verificar se CNPJ está disponível
      const cnpjCheck = await testApp
        .request()
        .get(`/associations/check-cnpj?cnpj=${associationData.cnpj}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(cnpjCheck.body.exists).toBe(false);

      // 3. Criar associação
      const createResponse = await testApp
        .request()
        .post('/associations')
        .send(associationData)
        .expect(HttpStatus.CREATED);

      expect(createResponse.body).toMatchObject({
        name: associationData.name,
        cnpj: associationData.cnpj,
        email: associationData.email,
      });

      // 4. Verificar que email agora existe
      const emailCheckAfter = await testApp
        .request()
        .get(`/associations/check-email?email=${associationData.email}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(emailCheckAfter.body.exists).toBe(true);

      // 5. Verificar que CNPJ agora existe
      const cnpjCheckAfter = await testApp
        .request()
        .get(`/associations/check-cnpj?cnpj=${associationData.cnpj}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(cnpjCheckAfter.body.exists).toBe(true);
    });
  });
});

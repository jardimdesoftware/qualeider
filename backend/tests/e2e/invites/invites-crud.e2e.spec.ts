import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { InviteFactory, UserFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

describe('E2E: Convites - Operações CRUD', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let adminToken: string;
  let commonUser: any;
  let associationId: number;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const adminUser = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin(),
    );
    adminToken = adminUser.token;

    const common = await authHelper.createUserAndLogin(
      UserFactory.buildProducer(),
    );
    commonUser = common.user;

    const prisma = testApp.getPrismaService();
    const association = await prisma.association.create({
      data: {
        name: 'Associação Teste E2E',
        cnpj: '12.345.678/0001-90',
        email: 'associacao.test@example.com',
        password: 'hashedpassword',
        landlinePhone: '(11) 98765-4321',
        zipCode: '01234-567',
        state: 'SP',
        city: 'São Paulo',
        street: 'Rua Teste',
        number: '123',
        neighborhood: 'Centro',
        coverageArea: 'Municipal',
        numberOfMembers: 50,
        presidentName: 'Presidente Teste',
        presidentCpf: '123.456.789-00',
        presidentEmail: 'presidente@test.com',
        presidentPhone: '(11) 91234-5678',
      },
    });
    associationId = association.id;
  });

  afterAll(async () => {
    await testApp.close();
    await teardownE2ETests();
  });

  describe('POST /invites/association/:associationId (Criar)', () => {
    it('deve criar um convite com sucesso', async () => {
      const inviteData = InviteFactory.build({ userId: commonUser.id });

      const response = await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.CREATED);
      expect(response.body).toHaveProperty(
        'message',
        'Convite enviado com sucesso',
      );

      const data = response.body.data;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('expiresAt');
    });

    it('deve criar um convite com mensagem personalizada', async () => {
      const newUser = await authHelper.createUserAndLogin(
        UserFactory.buildProducer(),
      );

      const customMessage = 'Convite especial para você!';
      const inviteData = InviteFactory.buildWithMessage(customMessage, {
        userId: newUser.user.id,
      });

      const response = await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.CREATED);

      expect(response.body.data).toHaveProperty(
        'message',
        'Convite enviado com sucesso',
      ); // Mensagem do controller, não do DTO
      expect(response.body.data).toHaveProperty('id');
    });

    it('deve retornar 404 se a associação não for encontrada (EntityNotFound)', async () => {
      const inviteData = InviteFactory.build({ userId: commonUser.id });

      await testApp
        .request()
        .post('/invites/association/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 404 se o usuário não for encontrado (EntityNotFound)', async () => {
      const inviteData = InviteFactory.build({ userId: 99999 });

      await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 400 (BusinessException) se o usuário já estiver vinculado à associação', async () => {
      const prisma = testApp.getPrismaService();
      await prisma.user.update({
        where: { id: commonUser.id },
        data: { associationId },
      });

      const inviteData = InviteFactory.build({ userId: commonUser.id });

      await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.BAD_REQUEST);

      await prisma.user.update({
        where: { id: commonUser.id },
        data: { associationId: null },
      });
    });

    it('deve retornar 400 se a mensagem for muito curta', async () => {
      const inviteData = InviteFactory.build({
        userId: commonUser.id,
        message: 'Short',
      });

      await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /invites/user/:userId/pending (Listar Pendentes)', () => {
    it('deve listar convites pendentes do usuário', async () => {
      // Criar usuário isolado para este teste para evitar conflito com outros convites
      const newUser = await authHelper.createUserAndLogin(
        UserFactory.buildProducer(),
      );

      const inviteData = InviteFactory.build({ userId: newUser.user.id });
      await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.CREATED);

      const response = await testApp
        .request()
        .get(`/invites/user/${newUser.user.id}/pending`)
        .set('Authorization', `Bearer ${newUser.token}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((invite: any) => {
        expect(invite.status).toBe('PENDING');
        expect(invite.userId).toBe(newUser.user.id);
      });
    });

    it('deve retornar array vazio se não houver convites pendentes', async () => {
      const newUser = await authHelper.createUserAndLogin(
        UserFactory.buildProducer(),
      );

      const response = await testApp
        .request()
        .get(`/invites/user/${newUser.user.id}/pending`)
        .set('Authorization', `Bearer ${newUser.token}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /invites/association/:associationId', () => {
    it('deve listar todos os convites da associação', async () => {
      const response = await testApp
        .request()
        .get(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar array vazio se a associação não tiver convites (ou não existir)', async () => {
      const response = await testApp
        .request()
        .get('/invites/association/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual([]);
    });
  });

  describe('DELETE /invites/association/:associationId/:inviteId', () => {
    let inviteId: number;

    beforeEach(async () => {
      const newUser = await authHelper.createUserAndLogin(
        UserFactory.buildProducer(),
      );

      const inviteData = InviteFactory.build({ userId: newUser.user.id });
      const response = await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData);

      inviteId = response.body.data.id;
    });

    it('deve cancelar convite com sucesso', async () => {
      const response = await testApp
        .request()
        .delete(`/invites/association/${associationId}/${inviteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.OK);
      expect(response.body).toHaveProperty(
        'message',
        'Convite cancelado com sucesso',
      );
    });

    it('deve retornar 404 se o convite não for encontrado (EntityNotFound)', async () => {
      await testApp
        .request()
        .delete(`/invites/association/${associationId}/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});

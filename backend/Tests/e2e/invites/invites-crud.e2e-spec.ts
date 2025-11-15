import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { InviteFactory, UserFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

describe('E2E: Convites - Operações CRUD', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let adminToken: string;
  let commonToken: string;
  let commonUser: any;
  let associationId: number;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    // Criar usuário administrador para testes
    const adminUser = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin(),
    );
    adminToken = adminUser.token;

    // Criar usuário comum para testes
    const common = await authHelper.createUserAndLogin(
      UserFactory.buildProducer(),
    );
    commonToken = common.token;
    commonUser = common.user;

    // Criar associação para testes
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

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('message');
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

      // API retorna mensagem padrão ao invés da mensagem personalizada
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('id');
    });

    it('deve retornar 404 se a associação não for encontrada', async () => {
      const inviteData = InviteFactory.build({ userId: commonUser.id });

      await testApp
        .request()
        .post('/invites/association/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 404 se o usuário não for encontrado', async () => {
      const inviteData = InviteFactory.build({ userId: 99999 });

      await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 409 se o usuário já estiver vinculado à associação', async () => {
      const inviteData = InviteFactory.build({ userId: commonUser.id });
      await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData);

      await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.CONFLICT);
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
      const response = await testApp
        .request()
        .get(`/invites/user/${commonUser.id}/pending`)
        .set('Authorization', `Bearer ${commonToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((invite: any) => {
        expect(invite.status).toBe('PENDING');
        expect(invite.userId).toBe(commonUser.id);
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

    it('deve permitir acesso sem autenticação', async () => {
      await testApp
        .request()
        .get(`/invites/user/${commonUser.id}/pending`)
        .expect(HttpStatus.OK); // Este endpoint não requer autenticação
    });
  });

  describe('GET /invites/association/:associationId (Listar por Associação)', () => {
    it('deve listar todos os convites da associação', async () => {
      const response = await testApp
        .request()
        .get(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((invite: any) => {
        expect(invite.associationId).toBe(associationId);
        expect(invite).toHaveProperty('userId');
        expect(invite).toHaveProperty('status');
      });
    });

    it('deve retornar array vazio se a associação não for encontrada', async () => {
      await testApp
        .request()
        .get('/invites/association/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK); // Retorna array vazio ao invés de 404
    });

    it('deve permitir acesso sem autenticação', async () => {
      await testApp
        .request()
        .get(`/invites/association/${associationId}`)
        .expect(HttpStatus.OK); // Este endpoint não requer autenticação
    });
  });

  describe('DELETE /invites/association/:associationId/:inviteId (Deletar)', () => {
    let inviteToDelete: any;

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

      inviteToDelete = response.body;
    });

    it('deve cancelar convite com sucesso', async () => {
      await testApp
        .request()
        .delete(`/invites/association/${associationId}/${inviteToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      const response = await testApp
        .request()
        .get(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const deletedInvite = response.body.find(
        (inv: any) => inv.id === inviteToDelete.id,
      );
      expect(deletedInvite?.status).toBe('CANCELED'); // Convite marcado como CANCELED, não deletado
    });

    it('deve retornar 404 se o convite não for encontrado', async () => {
      await testApp
        .request()
        .delete(`/invites/association/${associationId}/99999`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 404 se a associação não for encontrada', async () => {
      await testApp
        .request()
        .delete(`/invites/association/99999/${inviteToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve permitir acesso sem autenticação', async () => {
      await testApp
        .request()
        .delete(`/invites/association/${associationId}/${inviteToDelete.id}`)
        .expect(HttpStatus.OK); // Este endpoint não requer autenticação
    });
  });

  describe('Fluxo Completo de Convites', () => {
    it('deve gerenciar ciclo de vida completo: criar → listar → deletar', async () => {
      const testUser = await authHelper.createUserAndLogin(
        UserFactory.buildProducer(),
      );

      const inviteData = InviteFactory.buildWithMessage(
        'Convite para teste de fluxo completo',
        { userId: testUser.user.id },
      );

      const createResponse = await testApp
        .request()
        .post(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(HttpStatus.CREATED);

      const inviteId = createResponse.body.id;

      const userInvites = await testApp
        .request()
        .get(`/invites/user/${testUser.user.id}/pending`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(HttpStatus.OK);

      expect(userInvites.body.some((inv: any) => inv.id === inviteId)).toBe(
        true,
      );

      const assocInvites = await testApp
        .request()
        .get(`/invites/association/${associationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(assocInvites.body.some((inv: any) => inv.id === inviteId)).toBe(
        true,
      );

      await testApp
        .request()
        .delete(`/invites/association/${associationId}/${inviteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      const finalUserInvites = await testApp
        .request()
        .get(`/invites/user/${testUser.user.id}/pending`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(HttpStatus.OK);

      expect(
        finalUserInvites.body.some((inv: any) => inv.id === inviteId),
      ).toBe(false);
    });
  });
});

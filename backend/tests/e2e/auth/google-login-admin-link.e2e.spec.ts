import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory, AnimalFactory } from '../factories';
import { UserRole, Status, UserCategory } from '@/domain/enums/enums';
import { AuthService } from '@/auth/auth.service';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * Funcionário que entra pela primeira vez com Google precisa cair no grupo do
 * admin que liberou o email — antes ele sempre era vinculado ao PRIMEIRO admin
 * do banco, então com mais de um admin ele não via nada do que o "seu" admin
 * cadastrava.
 *
 * O callback real do Google não é chamado aqui (exigiria rede/credenciais):
 * o teste usa o AuthService do próprio módulo Nest, na etapa em que o perfil
 * do Google já foi validado (AuthService.loginWithGoogle).
 */
describe('E2E: Login com Google — vínculo com o admin que liberou o email', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let authService: AuthService;
  let adminA: { id: number; token: string };
  let adminB: { id: number; token: string };
  let animalAId: number;
  let animalBId: number;

  const prisma = () => testApp.getPrismaService();

  async function allowEmail(token: string, email: string) {
    return testApp
      .request()
      .post('/allowed-emails')
      .set(authHelper.authHeader(token))
      .send({ email });
  }

  async function googleLogin(email: string) {
    const { access_token } = await authService.loginWithGoogle({ email, name: 'Pessoa Google' });
    const user = await prisma().user.findUniqueOrThrow({ where: { email } });
    return { token: access_token, user };
  }

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);
    authService = testApp.getModule().get(AuthService, { strict: false });

    // A é criado antes de B: é o "primeiro admin" que o código antigo usava.
    const a = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'gl-admin-a@example.com', password: 'AdminA@1234' }),
    );
    adminA = { id: a.user.id!, token: a.token };
    const b = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'gl-admin-b@example.com', password: 'AdminB@1234' }),
    );
    adminB = { id: b.user.id!, token: b.token };

    const animalA = await testApp
      .request()
      .post('/animals')
      .set(authHelper.authHeader(adminA.token))
      .send(AnimalFactory.build({ name: 'Vaca do Admin A', userId: adminA.id }))
      .expect(HttpStatus.CREATED);
    animalAId = animalA.body.data.id;

    const animalB = await testApp
      .request()
      .post('/animals')
      .set(authHelper.authHeader(adminB.token))
      .send(AnimalFactory.build({ name: 'Vaca do Admin B', userId: adminB.id }))
      .expect(HttpStatus.CREATED);
    animalBId = animalB.body.data.id;
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('Funcionário novo liberado por um admin', () => {
    it('registra qual admin liberou o email', async () => {
      const response = await allowEmail(adminB.token, 'ext-b@gmail.com').then((r) => r);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.data.adminId).toBe(adminB.id);
    });

    it('é criado como VAQUEIRO do admin B (e não do primeiro admin, A)', async () => {
      const { user } = await googleLogin('ext-b@gmail.com');

      expect(user.role).toBe(UserRole.VAQUEIRO);
      expect(user.adminId).toBe(adminB.id);
      expect(user.adminId).not.toBe(adminA.id);
    });

    it('enxerga o rebanho do admin B e NÃO o do admin A', async () => {
      const { token, user } = await googleLogin('ext-b@gmail.com');

      const response = await testApp
        .request()
        .get(`/animals/user/${user.id}`)
        .set(authHelper.authHeader(token))
        .expect(HttpStatus.OK);

      const ids = response.body.data.map((a: any) => a.id);
      expect(ids).toContain(animalBId);
      expect(ids).not.toContain(animalAId);
    });
  });

  describe('Emails @ifpe.edu.br (sem admin responsável)', () => {
    it('continuam caindo no primeiro admin ativo', async () => {
      const { user } = await googleLogin('pessoa@ifpe.edu.br');

      expect(user.role).toBe(UserRole.VAQUEIRO);
      expect(user.adminId).toBe(adminA.id);
    });
  });

  describe('Liberação antiga (sem dono)', () => {
    it('continua caindo no primeiro admin ativo', async () => {
      await prisma().allowedEmail.create({ data: { email: 'legado@gmail.com' } });

      const { user } = await googleLogin('legado@gmail.com');

      expect(user.adminId).toBe(adminA.id);
    });
  });

  describe('Admin que liberou foi inativado', () => {
    it('cai no primeiro admin ativo em vez de vincular a um admin inativo', async () => {
      const c = await authHelper.createUserAndLogin(
        UserFactory.buildAdmin({ email: 'gl-admin-c@example.com', password: 'AdminC@1234' }),
      );
      await allowEmail(c.token, 'ext-c@gmail.com').then((r) => expect(r.status).toBe(201));
      await prisma().user.update({ where: { id: c.user.id! }, data: { status: Status.Inactive } });

      const { user } = await googleLogin('ext-c@gmail.com');

      expect(user.adminId).toBe(adminA.id);
    });
  });

  describe('Funcionário órfão (sem admin) que um admin liberou', () => {
    it('passa a ser vinculado ao admin que liberou no próximo login com Google', async () => {
      await prisma().user.create({
        data: {
          name: 'Órfão',
          email: 'orfao@gmail.com',
          password: await bcrypt.hash('qualquer', 4),
          userCategory: UserCategory.Fisica,
          city: 'Recife',
          state: 'PE',
          role: UserRole.VAQUEIRO,
        },
      });
      expect((await prisma().user.findUniqueOrThrow({ where: { email: 'orfao@gmail.com' } })).adminId).toBeNull();
      await allowEmail(adminB.token, 'orfao@gmail.com').then((r) => expect(r.status).toBe(201));

      const { user } = await googleLogin('orfao@gmail.com');

      expect(user.adminId).toBe(adminB.id);
    });

    it('NÃO muda o vínculo de quem já tem admin', async () => {
      const existing = await googleLogin('ext-b@gmail.com');
      // admin A também tenta "liberar" — o email já existe, então é recusado;
      // o funcionário permanece no grupo do admin B.
      await allowEmail(adminA.token, 'ext-b@gmail.com').then((r) =>
        expect(r.status).toBe(HttpStatus.BAD_REQUEST),
      );

      const again = await googleLogin('ext-b@gmail.com');

      expect(again.user.adminId).toBe(existing.user.adminId);
      expect(again.user.adminId).toBe(adminB.id);
    });
  });

  describe('Autorização e isolamento da lista de emails liberados', () => {
    it('admin A não vê nem remove a liberação do admin B', async () => {
      const list = await testApp
        .request()
        .get('/allowed-emails')
        .set(authHelper.authHeader(adminA.token))
        .expect(HttpStatus.OK);
      const emailsOfA = list.body.data.map((e: any) => e.email);
      expect(emailsOfA).not.toContain('ext-b@gmail.com');

      const ownByB = await prisma().allowedEmail.findUniqueOrThrow({ where: { email: 'ext-b@gmail.com' } });
      await testApp
        .request()
        .delete(`/allowed-emails/${ownByB.id}`)
        .set(authHelper.authHeader(adminA.token))
        .expect(HttpStatus.FORBIDDEN);
    });

    it('admin B vê as próprias liberações e as antigas sem dono', async () => {
      const list = await testApp
        .request()
        .get('/allowed-emails')
        .set(authHelper.authHeader(adminB.token))
        .expect(HttpStatus.OK);
      const emails = list.body.data.map((e: any) => e.email);

      expect(emails).toEqual(expect.arrayContaining(['ext-b@gmail.com', 'legado@gmail.com']));
    });

    it('admin consegue remover a própria liberação', async () => {
      const created = await allowEmail(adminB.token, 'remover@gmail.com');
      await testApp
        .request()
        .delete(`/allowed-emails/${created.body.data.id}`)
        .set(authHelper.authHeader(adminB.token))
        .expect(HttpStatus.OK);
    });

    it('funcionário (VAQUEIRO) não acessa a lista nem libera emails', async () => {
      const { token } = await googleLogin('ext-b@gmail.com');

      await testApp.request().get('/allowed-emails').set(authHelper.authHeader(token)).expect(HttpStatus.FORBIDDEN);
      await allowEmail(token, 'novo@gmail.com').then((r) => expect(r.status).toBe(HttpStatus.FORBIDDEN));
    });

    it('email que não foi liberado nem é @ifpe.edu.br continua sem acesso', async () => {
      await expect(
        authService.loginWithGoogle({ email: 'intruso@gmail.com' }),
      ).rejects.toThrow('Este email não tem acesso.');
    });
  });
});

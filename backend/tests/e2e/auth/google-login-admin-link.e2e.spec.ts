import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory, AnimalFactory } from '../factories';
import { UserRole, Status, UserCategory } from '@/domain/enums/enums';
import { AuthService } from '@/auth/auth.service';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * Todo mundo compartilha o mesmo rebanho: quem entra pela primeira vez com o Google
 * vira VAQUEIRO no grupo do admin raiz (o primeiro admin, sem adminId), não importa
 * qual admin liberou o e-mail. As liberações de e-mail também são compartilhadas.
 *
 * O callback real do Google não é chamado aqui (exigiria rede/credenciais): o teste
 * usa o AuthService do próprio módulo Nest, na etapa em que o perfil do Google já foi
 * validado (AuthService.loginWithGoogle).
 */
describe('E2E: Login com Google — todos entram no grupo do admin raiz', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let authService: AuthService;
  let adminA: { id: number; token: string };
  let adminB: { id: number; token: string };
  let animalAId: number;
  let animalBId: number;

  const prisma = () => testApp.getPrismaService();

  async function allowEmail(token: string, email: string) {
    return testApp.request().post('/allowed-emails').set(authHelper.authHeader(token)).send({ email });
  }

  async function googleLogin(email: string) {
    const { access_token } = await authService.loginWithGoogle({ email, name: 'Pessoa Google' });
    const user = await prisma().user.findUniqueOrThrow({ where: { email } });
    return { token: access_token, user };
  }

  const createAnimal = async (token: string, userId: number, name: string) =>
    (
      await testApp
        .request()
        .post('/animals')
        .set(authHelper.authHeader(token))
        .send(AnimalFactory.build({ name, userId }))
        .expect(HttpStatus.CREATED)
    ).body.data.id as number;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);
    authService = testApp.getModule().get(AuthService, { strict: false });

    // A é o admin raiz (o mais antigo, sem adminId); B é criado por A e fica no grupo dele.
    const a = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'gl-admin-a@example.com', password: 'AdminA@1234' }),
    );
    adminA = { id: a.user.id!, token: a.token };
    const created = await testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(adminA.token))
      .send({
        name: 'Admin B',
        email: 'gl-admin-b@example.com',
        password: 'AdminB@1234',
        role: 'ADMIN',
        userType: 'Pecuarista',
        userCategory: 'Fisica',
        city: 'Recife',
        state: 'PE',
      })
      .expect(HttpStatus.CREATED);
    adminB = { id: created.body.data.id, token: await authHelper.login('gl-admin-b@example.com', 'AdminB@1234') };

    animalAId = await createAnimal(adminA.token, adminA.id, 'Vaca do Admin A');
    animalBId = await createAnimal(adminB.token, adminB.id, 'Vaca do Admin B');
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('Funcionário novo liberado por um admin', () => {
    it('registra qual admin liberou o e-mail (só histórico)', async () => {
      const response = await allowEmail(adminB.token, 'ext-b@gmail.com');

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.data.adminId).toBe(adminB.id);
    });

    it('é criado como VAQUEIRO do admin raiz, mesmo tendo sido liberado pelo admin B', async () => {
      const { user } = await googleLogin('ext-b@gmail.com');

      expect(user.role).toBe(UserRole.VAQUEIRO);
      expect(user.adminId).toBe(adminA.id);
    });

    it('enxerga o rebanho inteiro: o do admin A e o do admin B', async () => {
      const { token, user } = await googleLogin('ext-b@gmail.com');

      const response = await testApp
        .request()
        .get(`/animals/user/${user.id}`)
        .set(authHelper.authHeader(token))
        .expect(HttpStatus.OK);

      const ids = response.body.data.map((a: any) => a.id);
      expect(ids).toEqual(expect.arrayContaining([animalAId, animalBId]));
    });
  });

  describe('Emails @ifpe.edu.br (sem admin responsável)', () => {
    it('entram no grupo do admin raiz', async () => {
      const { user } = await googleLogin('pessoa@ifpe.edu.br');

      expect(user.role).toBe(UserRole.VAQUEIRO);
      expect(user.adminId).toBe(adminA.id);
    });
  });

  describe('Liberação antiga (sem dono)', () => {
    it('também entra no grupo do admin raiz', async () => {
      await prisma().allowedEmail.create({ data: { email: 'legado@gmail.com' } });

      const { user } = await googleLogin('legado@gmail.com');

      expect(user.adminId).toBe(adminA.id);
    });
  });

  describe('Admin que liberou foi inativado', () => {
    it('não interfere: a conta nova segue no grupo do admin raiz', async () => {
      await allowEmail(adminB.token, 'ext-c@gmail.com').then((r) => expect(r.status).toBe(201));
      await prisma().user.update({ where: { id: adminB.id }, data: { status: Status.Inactive } });

      const { user } = await googleLogin('ext-c@gmail.com');

      expect(user.adminId).toBe(adminA.id);

      await prisma().user.update({ where: { id: adminB.id }, data: { status: Status.Active } });
    });
  });

  describe('Funcionário órfão (sem admin)', () => {
    it('passa a ser vinculado ao admin raiz no próximo login com Google', async () => {
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

      expect(user.adminId).toBe(adminA.id);
    });

    it('NÃO muda o vínculo de quem já tem admin', async () => {
      const existing = await googleLogin('ext-b@gmail.com');
      // outro admin tenta "liberar" um e-mail que já existe: é recusado.
      await allowEmail(adminA.token, 'ext-b@gmail.com').then((r) => expect(r.status).toBe(HttpStatus.BAD_REQUEST));

      const again = await googleLogin('ext-b@gmail.com');

      expect(again.user.adminId).toBe(existing.user.adminId);
      expect(again.user.adminId).toBe(adminA.id);
    });
  });

  describe('Autorização da lista de e-mails liberados (compartilhada entre admins)', () => {
    it('um admin vê as liberações feitas por outro admin e as antigas sem dono', async () => {
      const list = await testApp
        .request()
        .get('/allowed-emails')
        .set(authHelper.authHeader(adminA.token))
        .expect(HttpStatus.OK);
      const emails = list.body.data.map((e: any) => e.email);

      expect(emails).toEqual(expect.arrayContaining(['ext-b@gmail.com', 'legado@gmail.com']));
    });

    it('qualquer admin remove a liberação criada por outro', async () => {
      const created = await allowEmail(adminB.token, 'remover@gmail.com');
      await testApp
        .request()
        .delete(`/allowed-emails/${created.body.data.id}`)
        .set(authHelper.authHeader(adminA.token))
        .expect(HttpStatus.OK);
    });

    it('funcionário (VAQUEIRO) não acessa a lista nem libera e-mails', async () => {
      const { token } = await googleLogin('ext-b@gmail.com');

      await testApp.request().get('/allowed-emails').set(authHelper.authHeader(token)).expect(HttpStatus.FORBIDDEN);
      await allowEmail(token, 'novo@gmail.com').then((r) => expect(r.status).toBe(HttpStatus.FORBIDDEN));
    });

    it('e-mail que não foi liberado nem é @ifpe.edu.br continua sem acesso', async () => {
      await expect(authService.loginWithGoogle({ email: 'intruso@gmail.com' })).rejects.toThrow(
        'Este email não tem acesso.',
      );
    });
  });
});

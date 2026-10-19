import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory, AnimalFactory } from '../factories';
import { AuthService } from '@/auth/auth.service';
import { HttpStatus } from '@nestjs/common';

/**
 * Um único banco e um único rebanho: o admin fixo (raiz) cria outros admins e
 * vaqueiros, quem entra pelo Google vira vaqueiro do grupo da raiz, e todos
 * enxergam os mesmos dados. Só uma conta de fora desse grupo continua isolada.
 */
describe('E2E: Rebanho único compartilhado por todas as contas', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;

  let root: { id: number; token: string };
  let admin2: { id: number; token: string };
  let vaqueiro: { id: number; token: string };
  let googleUser: { id: number; token: string };
  let outsiderToken: string;

  const internal = (token: string, email: string, role: 'ADMIN' | 'VAQUEIRO') =>
    testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(token))
      .send({
        name: `Conta ${email}`,
        email,
        password: 'Senha@12345',
        role,
        userType: 'Pecuarista',
        userCategory: 'Fisica',
        city: 'Belo Jardim',
        state: 'PE',
      });

  const createAnimal = async (token: string, userId: number, name: string) =>
    (
      await testApp
        .request()
        .post('/animals')
        .set(authHelper.authHeader(token))
        .send(AnimalFactory.build({ name, userId }))
        .expect(HttpStatus.CREATED)
    ).body.data.id as number;

  const animalNames = async (token: string) => {
    const res = await testApp.request().get('/animals').set(authHelper.authHeader(token)).expect(HttpStatus.OK);
    return (res.body.data as { name: string }[]).map((a) => a.name);
  };

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const rootUser = await authHelper.createTestUser(
      UserFactory.buildAdmin({ email: 'raiz@example.com', password: 'Raiz@12345' }),
    );
    root = { id: rootUser.id!, token: await authHelper.login('raiz@example.com', 'Raiz@12345') };

    const created = await internal(root.token, 'admin2@example.com', 'ADMIN').expect(HttpStatus.CREATED);
    admin2 = { id: created.body.data.id, token: await authHelper.login('admin2@example.com', 'Senha@12345') };

    // O vaqueiro é criado pelo SEGUNDO admin e mesmo assim entra no grupo da raiz.
    const vaq = await internal(admin2.token, 'vaqueiro@example.com', 'VAQUEIRO').expect(HttpStatus.CREATED);
    vaqueiro = { id: vaq.body.data.id, token: await authHelper.login('vaqueiro@example.com', 'Senha@12345') };

    const google = await testApp
      .getModule()
      .get(AuthService)
      .loginWithGoogle({ email: 'novo.aluno@ifpe.edu.br', name: 'Aluno' });
    const googleRow = await testApp.getPrismaService().user.findUniqueOrThrow({ where: { email: 'novo.aluno@ifpe.edu.br' } });
    googleUser = { id: googleRow.id, token: google.access_token };

    const outsider = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'de.fora@example.com', password: 'Fora@12345' }),
    );
    outsiderToken = outsider.token;

    await createAnimal(root.token, root.id, 'Vaca da raiz');
    await createAnimal(admin2.token, admin2.id, 'Vaca do admin 2');
    await createAnimal(vaqueiro.token, vaqueiro.id, 'Vaca do vaqueiro');
    await createAnimal(googleUser.token, googleUser.id, 'Vaca do aluno');
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  it('toda conta criada fica ligada à raiz (admin criado por admin, vaqueiro criado por outro admin e login do Google)', async () => {
    const prisma = testApp.getPrismaService();
    const [a2, v, g] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: admin2.id } }),
      prisma.user.findUniqueOrThrow({ where: { id: vaqueiro.id } }),
      prisma.user.findUniqueOrThrow({ where: { id: googleUser.id } }),
    ]);
    expect(a2.adminId).toBe(root.id);
    expect(v.adminId).toBe(root.id);
    expect(g.adminId).toBe(root.id);
    expect(g.role).toBe('VAQUEIRO');
  });

  it('todos enxergam os mesmos animais, de quem quer que tenha cadastrado', async () => {
    const expected = ['Vaca da raiz', 'Vaca do admin 2', 'Vaca do vaqueiro', 'Vaca do aluno'];
    for (const token of [root.token, admin2.token, vaqueiro.token, googleUser.token]) {
      expect(await animalNames(token)).toEqual(expect.arrayContaining(expected));
    }
  });

  it('a tela de funcionários (GET /users) mostra todas as contas do grupo para qualquer admin', async () => {
    for (const token of [root.token, admin2.token]) {
      const res = await testApp.request().get('/users').set(authHelper.authHeader(token)).expect(HttpStatus.OK);
      const emails = (res.body.data as { email: string }[]).map((u) => u.email);
      expect(emails).toEqual(
        expect.arrayContaining(['raiz@example.com', 'admin2@example.com', 'vaqueiro@example.com', 'novo.aluno@ifpe.edu.br']),
      );
    }
  });

  it('o relatório mensal soma o grupo todo', async () => {
    const now = new Date();
    const res = await testApp
      .request()
      .get(`/reports/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .set(authHelper.authHeader(admin2.token))
      .expect(HttpStatus.OK);
    expect(res.body.data.totalAnimals).toBe(4);
  });

  it('as liberações de e-mail do Google são compartilhadas: um admin vê e remove a que outro criou', async () => {
    const created = await testApp
      .request()
      .post('/allowed-emails')
      .set(authHelper.authHeader(root.token))
      .send({ email: 'externo@gmail.com' })
      .expect(HttpStatus.CREATED);

    const list = await testApp
      .request()
      .get('/allowed-emails')
      .set(authHelper.authHeader(admin2.token))
      .expect(HttpStatus.OK);
    expect(JSON.stringify(list.body)).toContain('externo@gmail.com');

    await testApp
      .request()
      .delete(`/allowed-emails/${created.body.data.id}`)
      .set(authHelper.authHeader(admin2.token))
      .expect(HttpStatus.OK);
  });

  it('vaqueiro não administra contas', async () => {
    await testApp
      .request()
      .patch(`/users/${admin2.id}`)
      .set(authHelper.authHeader(vaqueiro.token))
      .send({ city: 'X' })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('um admin edita e desativa contas criadas por outro admin do grupo', async () => {
    await testApp
      .request()
      .patch(`/users/${vaqueiro.id}`)
      .set(authHelper.authHeader(root.token))
      .send({ city: 'Recife' })
      .expect(HttpStatus.OK);
    await testApp
      .request()
      .delete(`/users/${googleUser.id}`)
      .set(authHelper.authHeader(admin2.token))
      .expect(HttpStatus.OK);
  });

  it('uma conta de fora do grupo (outra raiz) continua sem ver nada do rebanho', async () => {
    expect(await animalNames(outsiderToken)).toEqual([]);
  });
});

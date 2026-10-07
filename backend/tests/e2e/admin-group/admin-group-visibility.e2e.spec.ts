import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory, AnimalFactory, DailyCollectionFactory } from '../factories';
import { UserRole, Status } from '@/domain/enums/enums';
import { HttpStatus } from '@nestjs/common';

/**
 * Regressões do fluxo Admin + Vaqueiro (grupo/rebanho do dono da fazenda):
 *
 * 1. O vaqueiro enxerga o que o admin cadastrou (e vice-versa), e NÃO enxerga
 *    o rebanho de outro admin.
 * 2. Relatório mensal: para ADMIN/VAQUEIRO sem associação ele retornava sempre
 *    zero (o id do usuário era tratado como id de associação).
 * 3. "Mostrar inativos": a listagem de gestão do rebanho nunca devolvia os
 *    animais inativados, então o toggle não tinha efeito.
 * 4. Funcionário inativado precisa continuar carregável na tela de edição
 *    (GET /users/:id) para poder ser reativado — sem enfraquecer o bloqueio de
 *    login de contas inativas.
 */
describe('E2E: Grupo Admin + Vaqueiro (visibilidade e relatórios)', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;

  let adminA: { id: number; token: string };
  let adminB: { id: number; token: string };
  let vaqueiroA: { id: number; email: string; password: string; token: string };
  let vaqueiroB: { id: number; token: string };

  let adminAnimalId: number;
  let vaqueiroAnimalId: number;
  let reportYear: number;
  let reportMonth: number;

  async function createVaqueiro(adminToken: string, email: string, password: string) {
    const data = UserFactory.build({ email, password, role: UserRole.VAQUEIRO });
    const created = await testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(adminToken))
      .send(data)
      .expect(HttpStatus.CREATED);
    const token = await authHelper.login(email, password);
    return { id: created.body.data.id as number, email, password, token };
  }

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const a = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'grp-admin-a@example.com', password: 'AdminA@1234' }),
    );
    adminA = { id: a.user.id!, token: a.token };

    const b = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'grp-admin-b@example.com', password: 'AdminB@1234' }),
    );
    adminB = { id: b.user.id!, token: b.token };

    vaqueiroA = await createVaqueiro(adminA.token, 'grp-vaq-a@example.com', 'VaqA@1234');
    vaqueiroB = await createVaqueiro(adminB.token, 'grp-vaq-b@example.com', 'VaqB@1234');

    const adminAnimal = await testApp
      .request()
      .post('/animals')
      .set(authHelper.authHeader(adminA.token))
      .send(AnimalFactory.build({ name: 'Vaca do Admin A', userId: adminA.id }))
      .expect(HttpStatus.CREATED);
    adminAnimalId = adminAnimal.body.data.id;

    const vaqueiroAnimal = await testApp
      .request()
      .post('/animals')
      .set(authHelper.authHeader(vaqueiroA.token))
      .send(AnimalFactory.build({ name: 'Vaca do Vaqueiro A', userId: vaqueiroA.id }))
      .expect(HttpStatus.CREATED);
    vaqueiroAnimalId = vaqueiroAnimal.body.data.id;

    // Dia 15 do mês anterior: evita bordas de virada de mês/fuso no relatório.
    const ref = new Date();
    const collectionDay = new Date(ref.getFullYear(), ref.getMonth() - 1, 15);
    reportYear = collectionDay.getFullYear();
    reportMonth = collectionDay.getMonth() + 1;
    const collectionDate = `${reportYear}-${String(reportMonth).padStart(2, '0')}-15`;

    await testApp
      .request()
      .post('/daily-collections')
      .set(authHelper.authHeader(adminA.token))
      .send(
        DailyCollectionFactory.build({
          userId: adminA.id,
          quantity: 40,
          items: [{ animalId: adminAnimalId, quantity: 40 }],
          collectionDate,
        }),
      )
      .expect(HttpStatus.CREATED);

    await testApp
      .request()
      .post('/daily-collections')
      .set(authHelper.authHeader(vaqueiroA.token))
      .send(
        DailyCollectionFactory.build({
          userId: vaqueiroA.id,
          quantity: 25,
          items: [{ animalId: vaqueiroAnimalId, quantity: 25 }],
          collectionDate,
        }),
      )
      .expect(HttpStatus.CREATED);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('Visibilidade do rebanho', () => {
    it('vaqueiro vê o animal que o admin cadastrou e o próprio', async () => {
      const response = await testApp
        .request()
        .get(`/animals/user/${vaqueiroA.id}`)
        .set(authHelper.authHeader(vaqueiroA.token))
        .expect(HttpStatus.OK);

      const ids = response.body.data.map((a: any) => a.id);
      expect(ids).toEqual(expect.arrayContaining([adminAnimalId, vaqueiroAnimalId]));
    });

    it('vaqueiro de OUTRO admin não vê o rebanho do admin A', async () => {
      const response = await testApp
        .request()
        .get(`/animals/user/${vaqueiroB.id}`)
        .set(authHelper.authHeader(vaqueiroB.token))
        .expect(HttpStatus.OK);

      const ids = response.body.data.map((a: any) => a.id);
      expect(ids).not.toContain(adminAnimalId);
      expect(ids).not.toContain(vaqueiroAnimalId);
    });

    it('vaqueiro vê as coletas do grupo (admin + vaqueiro)', async () => {
      const response = await testApp
        .request()
        .get(`/daily-collections/user/${vaqueiroA.id}`)
        .set(authHelper.authHeader(vaqueiroA.token))
        .expect(HttpStatus.OK);

      const owners = response.body.data.map((c: any) => c.userId);
      expect(owners).toEqual(expect.arrayContaining([adminA.id, vaqueiroA.id]));
    });

    it('vaqueiro de outro admin não vê as coletas do grupo A', async () => {
      const response = await testApp
        .request()
        .get(`/daily-collections/user/${vaqueiroB.id}`)
        .set(authHelper.authHeader(vaqueiroB.token))
        .expect(HttpStatus.OK);

      const owners = response.body.data.map((c: any) => c.userId);
      expect(owners).not.toContain(adminA.id);
      expect(owners).not.toContain(vaqueiroA.id);
    });
  });

  describe('GET /associations/reports/monthly (admin/vaqueiro sem associação)', () => {
    const url = () => `/associations/reports/monthly?year=${reportYear}&month=${reportMonth}`;

    it('admin recebe a produção somada do grupo (antes retornava sempre zero)', async () => {
      const response = await testApp
        .request()
        .get(url())
        .set(authHelper.authHeader(adminA.token))
        .expect(HttpStatus.OK);

      expect(response.body.data.totalProduction).toBe(65);
      expect(response.body.data.totalCollections).toBe(2);
      expect(response.body.data.totalProducers).toBe(2);
      expect(response.body.data.totalAnimals).toBe(2);
    });

    it('vaqueiro enxerga o mesmo relatório do grupo do seu admin', async () => {
      const response = await testApp
        .request()
        .get(url())
        .set(authHelper.authHeader(vaqueiroA.token))
        .expect(HttpStatus.OK);

      expect(response.body.data.totalProduction).toBe(65);
      expect(response.body.data.totalCollections).toBe(2);
    });

    it('admin de outro grupo não recebe a produção do grupo A', async () => {
      const response = await testApp
        .request()
        .get(url())
        .set(authHelper.authHeader(adminB.token))
        .expect(HttpStatus.OK);

      expect(response.body.data.totalProduction).toBe(0);
      expect(response.body.data.totalCollections).toBe(0);
    });
  });

  describe('Animais inativos ("Mostrar inativos")', () => {
    it('animal inativado continua na listagem de gestão do rebanho, marcado como Inactive', async () => {
      await testApp
        .request()
        .patch(`/animals/${vaqueiroAnimalId}/inativar`)
        .set(authHelper.authHeader(adminA.token))
        .expect(HttpStatus.OK);

      const response = await testApp
        .request()
        .get(`/animals/user/${vaqueiroA.id}`)
        .set(authHelper.authHeader(vaqueiroA.token))
        .expect(HttpStatus.OK);

      const inactive = response.body.data.find((a: any) => a.id === vaqueiroAnimalId);
      expect(inactive).toBeDefined();
      expect(inactive.status).toBe(Status.Inactive);
    });

    it('a listagem pública padrão continua devolvendo só animais ativos', async () => {
      const response = await testApp
        .request()
        .get(`/animals?userId=${vaqueiroA.id}`)
        .set(authHelper.authHeader(adminA.token))
        .expect(HttpStatus.OK);

      const ids = response.body.data.map((a: any) => a.id);
      expect(ids).not.toContain(vaqueiroAnimalId);
    });
  });

  describe('Funcionário inativado: edição e reativação', () => {
    let employee: { id: number; email: string; password: string; token: string };

    beforeAll(async () => {
      employee = await createVaqueiro(adminA.token, 'grp-reativar@example.com', 'Reativar@1234');
      await testApp
        .request()
        .put(`/users/${employee.id}`)
        .set(authHelper.authHeader(adminA.token))
        .send({ status: Status.Inactive })
        .expect(HttpStatus.OK);
    }, E2E_TIMEOUT);

    it('admin ainda consegue carregar o funcionário inativo na tela de edição', async () => {
      const response = await testApp
        .request()
        .get(`/users/${employee.id}`)
        .set(authHelper.authHeader(adminA.token))
        .expect(HttpStatus.OK);

      expect(response.body.data.status).toBe(Status.Inactive);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('conta inativa NÃO consegue logar (bloqueio mantido)', async () => {
      await testApp
        .request()
        .post('/auth/login')
        .send({ email: employee.email, password: employee.password })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('token emitido antes da inativação deixa de valer (JwtStrategy segue Active-only)', async () => {
      const response = await testApp
        .request()
        .get(`/animals/user/${employee.id}`)
        .set(authHelper.authHeader(employee.token));

      // Hoje a JwtStrategy propaga o 404 de "usuário inativo"; o que importa
      // aqui é que o acesso NÃO é concedido.
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND]).toContain(response.status);
    });

    it('vaqueiro não pode usar GET /users/:id (só admin)', async () => {
      await testApp
        .request()
        .get(`/users/${vaqueiroA.id}`)
        .set(authHelper.authHeader(vaqueiroA.token))
        .expect(HttpStatus.FORBIDDEN);
    });

    it('admin reativa e a conta volta a logar', async () => {
      await testApp
        .request()
        .put(`/users/${employee.id}`)
        .set(authHelper.authHeader(adminA.token))
        .send({ status: Status.Active })
        .expect(HttpStatus.OK);

      await testApp
        .request()
        .post('/auth/login')
        .send({ email: employee.email, password: employee.password })
        .expect(HttpStatus.OK);
    });
  });
});

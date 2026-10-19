import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AssociationFactory, UserFactory, AnimalFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

/**
 * Quando o admin de uma fazenda entra numa associação, o rebanho dele passa a ser o
 * da associação (User.associationId). Os funcionários (VAQUEIRO) ficavam com
 * associationId nulo e sumiam da tela de Funcionários e do rebanho do admin, enquanto
 * o próprio funcionário ainda via tudo. Agora eles entram junto com o admin.
 */
describe('E2E: Funcionários acompanham o admin na associação', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;

  let associationId: number;
  let associationToken: string;
  let adminId: number;
  let adminEmail: string;
  let vaqueiroEmail: string;
  let vaqueiroId: number;
  let vaqueiroAnimalName: string;

  const adminPassword = 'Fazenda@1234';
  const employeePassword = 'Func@12345';

  const createEmployee = async (token: string, email: string) => {
    const res = await testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(token))
      .send({
        name: 'Funcionário Teste',
        email,
        password: employeePassword,
        role: 'VAQUEIRO',
        userType: 'Pecuarista',
        userCategory: 'Fisica',
        city: 'Belo Jardim',
        state: 'PE',
      })
      .expect(HttpStatus.CREATED);
    return res.body.data.id as number;
  };

  const listedEmails = async (token: string) => {
    const res = await testApp.request().get('/users').set(authHelper.authHeader(token)).expect(HttpStatus.OK);
    return (res.body.data as { email: string }[]).map((u) => u.email);
  };

  const herdNames = async (token: string) => {
    const res = await testApp
      .request()
      .get(`/animals/user/${adminId}`)
      .set(authHelper.authHeader(token))
      .expect(HttpStatus.OK);
    return (res.body.data as { name: string }[]).map((a) => a.name);
  };

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    const association = AssociationFactory.build();
    const created = await testApp.request().post('/associations').send(association).expect(HttpStatus.CREATED);
    associationId = created.body.data.id;
    associationToken = await authHelper.login(association.email!, association.password!);

    adminEmail = 'fazenda.membro@example.com';
    const admin = await authHelper.createTestUser(
      UserFactory.buildAdmin({ email: adminEmail, password: adminPassword }),
    );
    adminId = admin.id!;
    const adminToken = await authHelper.login(adminEmail, adminPassword);

    // Funcionário cadastrado ANTES de o admin entrar na associação.
    vaqueiroEmail = 'vaqueiro.membro@example.com';
    vaqueiroId = await createEmployee(adminToken, vaqueiroEmail);
    const vaqueiroToken = await authHelper.login(vaqueiroEmail, employeePassword);
    vaqueiroAnimalName = 'Vaca do vaqueiro';
    await testApp
      .request()
      .post('/animals')
      .set(authHelper.authHeader(vaqueiroToken))
      .send(AnimalFactory.build({ name: vaqueiroAnimalName, userId: vaqueiroId }))
      .expect(HttpStatus.CREATED);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  it('antes de entrar na associação, o admin vê o funcionário e o animal dele', async () => {
    const token = await authHelper.login(adminEmail, adminPassword);

    expect(await listedEmails(token)).toContain(vaqueiroEmail);
    expect(await herdNames(token)).toContain(vaqueiroAnimalName);
  });

  it('ao aceitar o convite, os funcionários do admin entram na associação junto com ele', async () => {
    const adminToken = await authHelper.login(adminEmail, adminPassword);
    await testApp
      .request()
      .post(`/invites/association/${associationId}`)
      .set(authHelper.authHeader(associationToken))
      .send({ userId: adminId, message: 'Convite para entrar na associação.' })
      .expect(HttpStatus.CREATED);
    const pending = await testApp
      .request()
      .get(`/invites/user/${adminId}/pending`)
      .set(authHelper.authHeader(adminToken))
      .expect(HttpStatus.OK);
    const inviteToken = pending.body.data[0].token as string;

    await testApp
      .request()
      .patch(`/invites/token/${inviteToken}/respond`)
      .set(authHelper.authHeader(adminToken))
      .send({ response: 'Accept' })
      .expect(HttpStatus.OK);

    const prisma = testApp.getPrismaService();
    const [admin, vaqueiro] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: adminId } }),
      prisma.user.findUniqueOrThrow({ where: { id: vaqueiroId } }),
    ]);
    expect(admin.associationId).toBe(associationId);
    expect(vaqueiro.associationId).toBe(associationId);
  });

  it('depois de entrar, o admin continua vendo os funcionários e o rebanho deles, e o funcionário vê o mesmo', async () => {
    const adminToken = await authHelper.login(adminEmail, adminPassword);
    const vaqueiroToken = await authHelper.login(vaqueiroEmail, employeePassword);

    const emails = await listedEmails(adminToken);
    expect(emails).toEqual(expect.arrayContaining([adminEmail, vaqueiroEmail]));

    expect(await herdNames(adminToken)).toContain(vaqueiroAnimalName);
    expect(await herdNames(vaqueiroToken)).toContain(vaqueiroAnimalName);
  });

  it('funcionário cadastrado depois de o admin entrar já nasce na associação, sem precisar mandar associationId', async () => {
    const adminToken = await authHelper.login(adminEmail, adminPassword);

    const newId = await createEmployee(adminToken, 'vaqueiro.novo@example.com');

    const created = await testApp.getPrismaService().user.findUniqueOrThrow({ where: { id: newId } });
    expect(created.associationId).toBe(associationId);
    expect(created.adminId).toBe(adminId);
  });

  it('uma fazenda de fora da associação continua sem ver o rebanho nem os funcionários', async () => {
    const outsider = await authHelper.createUserAndLogin(
      UserFactory.buildAdmin({ email: 'fazenda.de.fora@example.com', password: 'Fora@12345' }),
    );

    expect(await listedEmails(outsider.token)).not.toContain(vaqueiroEmail);
    const res = await testApp
      .request()
      .get(`/animals/user/${adminId}`)
      .set(authHelper.authHeader(outsider.token));
    expect([HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND]).toContain(res.status);
  });
});

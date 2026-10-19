import { setupE2ETests, teardownE2ETests, cleanDatabase, E2E_TIMEOUT, prisma } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AnimalFactory } from '../factories';
import { UserRole } from '@/domain/enums/enums';
import { DefaultAccountsService } from '@/application/services/users/default-accounts.service';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';

/**
 * Contas locais (e-mail/senha, sem Google) criadas na subida da API a partir de
 * variáveis de ambiente: um ADMIN e um VAQUEIRO vinculado a ele.
 */
describe('E2E: Contas padrão na subida da aplicação', () => {
  const ENV_KEYS = [
    'DEFAULT_ADMIN_EMAIL',
    'DEFAULT_ADMIN_PASSWORD',
    'DEFAULT_ADMIN_NAME',
    'DEFAULT_VAQUEIRO_EMAIL',
    'DEFAULT_VAQUEIRO_PASSWORD',
    'DEFAULT_VAQUEIRO_NAME',
  ];
  const ADMIN = { email: 'padrao.admin@example.com', password: 'AdminPadrao@123' };
  const VAQUEIRO = { email: 'padrao.vaqueiro@example.com', password: 'VaqPadrao@123' };

  let testApp: TestApp;
  let authHelper: AuthHelper;

  beforeAll(async () => {
    await setupE2ETests();
    process.env.DEFAULT_ADMIN_EMAIL = ADMIN.email;
    process.env.DEFAULT_ADMIN_PASSWORD = ADMIN.password;
    process.env.DEFAULT_ADMIN_NAME = 'Admin Padrão';
    process.env.DEFAULT_VAQUEIRO_EMAIL = VAQUEIRO.email.toUpperCase();
    process.env.DEFAULT_VAQUEIRO_PASSWORD = VAQUEIRO.password;
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    for (const key of ENV_KEYS) delete process.env[key];
    await teardownE2ETests();
  });

  it('cria o ADMIN e o VAQUEIRO e os dois entram por e-mail e senha', async () => {
    const adminToken = await authHelper.login(ADMIN.email, ADMIN.password);
    const vaqueiroToken = await authHelper.login(VAQUEIRO.email, VAQUEIRO.password);
    expect(adminToken).toBeTruthy();
    expect(vaqueiroToken).toBeTruthy();

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN.email } });
    const vaqueiro = await prisma.user.findUniqueOrThrow({ where: { email: VAQUEIRO.email } });
    expect(admin.role).toBe(UserRole.ADMIN);
    expect(admin.name).toBe('Admin Padrão');
    expect(vaqueiro.role).toBe(UserRole.VAQUEIRO);
  });

  it('guarda a senha com hash e nunca em texto puro', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN.email } });
    expect(admin.password).not.toBe(ADMIN.password);
    expect(admin.password).toMatch(/^\$2[aby]\$/);
  });

  it('vincula o VAQUEIRO ao ADMIN (adminId) e os dois enxergam o mesmo rebanho', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN.email } });
    const vaqueiro = await prisma.user.findUniqueOrThrow({ where: { email: VAQUEIRO.email } });
    expect(vaqueiro.adminId).toBe(admin.id);
    expect(admin.adminId).toBeNull();

    const adminToken = await authHelper.login(ADMIN.email, ADMIN.password);
    const vaqueiroToken = await authHelper.login(VAQUEIRO.email, VAQUEIRO.password);

    const create = (token: string, userId: number, name: string) =>
      testApp
        .request()
        .post('/animals')
        .set(authHelper.authHeader(token))
        .send(AnimalFactory.build({ name, userId }))
        .expect(HttpStatus.CREATED);
    await create(adminToken, admin.id, 'Vaca do admin');
    await create(vaqueiroToken, vaqueiro.id, 'Vaca do vaqueiro');

    for (const token of [adminToken, vaqueiroToken]) {
      const res = await testApp
        .request()
        .get(`/animals/user/${admin.id}`)
        .set(authHelper.authHeader(token))
        .expect(HttpStatus.OK);
      const names = (res.body.data as { name: string }[]).map((a) => a.name).sort();
      expect(names).toEqual(['Vaca do admin', 'Vaca do vaqueiro']);
    }
  });

  it('é idempotente: subir de novo não duplica nem troca a senha das contas existentes', async () => {
    const before = await prisma.user.findMany({ orderBy: { id: 'asc' } });

    process.env.DEFAULT_ADMIN_PASSWORD = 'OutraSenha@999';
    await testApp.getModule().get(DefaultAccountsService).ensureDefaultAccounts();

    const after = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    expect(after).toHaveLength(before.length);
    expect(after.map((u) => u.password)).toEqual(before.map((u) => u.password));
    process.env.DEFAULT_ADMIN_PASSWORD = ADMIN.password;
    await expect(authHelper.login(ADMIN.email, ADMIN.password)).resolves.toBeTruthy();
  });

  it('reativa as contas padrão desativadas, sem trocar a senha', async () => {
    const before = await prisma.user.findMany({ where: { email: { in: [ADMIN.email, VAQUEIRO.email] } } });
    await prisma.user.updateMany({ where: { email: { in: [ADMIN.email, VAQUEIRO.email] } }, data: { status: 'Inactive' } });
    await testApp
      .request()
      .post('/auth/login')
      .send({ email: ADMIN.email, password: ADMIN.password })
      .expect(HttpStatus.UNAUTHORIZED);

    await testApp.getModule().get(DefaultAccountsService).ensureDefaultAccounts();

    const after = await prisma.user.findMany({ where: { email: { in: [ADMIN.email, VAQUEIRO.email] } } });
    expect(after.every((u) => u.status === 'Active')).toBe(true);
    expect(after.map((u) => u.password).sort()).toEqual(before.map((u) => u.password).sort());
    await expect(authHelper.login(ADMIN.email, ADMIN.password)).resolves.toBeTruthy();
    await expect(authHelper.login(VAQUEIRO.email, VAQUEIRO.password)).resolves.toBeTruthy();
  });

  /**
   * Na subida em banco vazio, `DefaultAccountsService` e `AccountPurgeService` pedem
   * as mesmas contas ao mesmo tempo: nenhum dos dois pode falhar com "Email já está
   * em uso" nem consumir id da sequência com um insert que ia falhar.
   */
  describe('corrida na criação das contas', () => {
    const EMAILS = [ADMIN.email, VAQUEIRO.email];
    const accountsFrom = () => testApp.getModule().get(DefaultAccountsService);
    const listAccounts = () => prisma.user.findMany({ where: { email: { in: EMAILS } }, orderBy: { id: 'asc' } });

    /** Outra instância da API (processo diferente): não compartilha a promessa em andamento. */
    const buildIndependentInstance = (userRepository: IUserRepository = testApp.getModule().get(IUserRepository)) =>
      new DefaultAccountsService(
        userRepository,
        testApp.getModule().get(IHashService),
        testApp.getModule().get(ConfigService),
      );

    beforeEach(async () => {
      await cleanDatabase();
    });

    it('duas execuções simultâneas no mesmo processo criam cada conta uma só vez, sem pular id', async () => {
      const accounts = accountsFrom();

      await Promise.all([accounts.ensureDefaultAccounts(), accounts.ensureDefaultAccounts()]);

      const [admin, vaqueiro, ...others] = await listAccounts();
      expect(others).toHaveLength(0);
      expect(admin.role).toBe(UserRole.ADMIN);
      expect(vaqueiro.role).toBe(UserRole.VAQUEIRO);
      expect(vaqueiro.adminId).toBe(admin.id);
      expect(vaqueiro.id).toBe(admin.id + 1);
      await expect(prisma.user.count()).resolves.toBe(2);
    });

    it('duas instâncias independentes subindo juntas em banco vazio terminam sem erro e com uma conta de cada', async () => {
      await expect(
        Promise.all([buildIndependentInstance().ensureDefaultAccounts(), buildIndependentInstance().ensureDefaultAccounts()]),
      ).resolves.toBeDefined();

      const [admin, vaqueiro, ...others] = await listAccounts();
      expect(others).toHaveLength(0);
      expect(vaqueiro.adminId).toBe(admin.id);
      await expect(prisma.user.count()).resolves.toBe(2);
    });

    it('create que bate no e-mail já criado por outra instância segue sem erro, adota a conta e reativa a inativa sem trocar a senha', async () => {
      await accountsFrom().ensureDefaultAccounts();
      await prisma.user.updateMany({ where: { email: { in: EMAILS } }, data: { status: 'Inactive' } });
      const before = await listAccounts();

      // Esta instância ainda não "enxerga" as contas na primeira consulta de cada e-mail
      // (elas foram criadas por outra instância depois), então o `create` bate na
      // unicidade do e-mail no banco de verdade.
      const realRepository = testApp.getModule().get<IUserRepository>(IUserRepository);
      const alreadyLooked = new Set<string>();
      const lateRepository = Object.create(realRepository) as IUserRepository;
      lateRepository.findByEmail = async (email: string) => {
        if (alreadyLooked.has(email)) return realRepository.findByEmail(email);
        alreadyLooked.add(email);
        return null;
      };

      await expect(buildIndependentInstance(lateRepository).ensureDefaultAccounts()).resolves.toBeUndefined();

      const after = await listAccounts();
      expect(after.map((u) => u.id)).toEqual(before.map((u) => u.id));
      expect(after.map((u) => u.password)).toEqual(before.map((u) => u.password));
      expect(after.every((u) => u.status === 'Active')).toBe(true);
      await expect(prisma.user.count()).resolves.toBe(2);
    });
  });
});

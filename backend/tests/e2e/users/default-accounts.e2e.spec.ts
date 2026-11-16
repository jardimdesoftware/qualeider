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
 * Admin FIXO (e-mail/senha, sem Google) criado na subida da API a partir de
 * variáveis de ambiente. É o único: nada de vaqueiro fixo. As demais contas vêm do
 * login pelo Google ou são criadas por um admin.
 */
describe('E2E: Admin fixo na subida da aplicação', () => {
  const ENV_KEYS = [
    'DEFAULT_ADMIN_EMAIL',
    'DEFAULT_ADMIN_PASSWORD',
    'DEFAULT_ADMIN_NAME',
    'DEFAULT_VAQUEIRO_EMAIL',
    'DEFAULT_VAQUEIRO_PASSWORD',
  ];
  const ADMIN = { email: 'padrao.admin@example.com', password: 'AdminPadrao@123' };

  let testApp: TestApp;
  let authHelper: AuthHelper;

  beforeAll(async () => {
    await setupE2ETests();
    process.env.DEFAULT_ADMIN_EMAIL = ADMIN.email.toUpperCase();
    process.env.DEFAULT_ADMIN_PASSWORD = ADMIN.password;
    process.env.DEFAULT_ADMIN_NAME = 'Admin Padrão';
    // Variáveis antigas do vaqueiro fixo não criam mais nada.
    process.env.DEFAULT_VAQUEIRO_EMAIL = 'padrao.vaqueiro@example.com';
    process.env.DEFAULT_VAQUEIRO_PASSWORD = 'VaqPadrao@123';
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    for (const key of ENV_KEYS) delete process.env[key];
    await teardownE2ETests();
  });

  it('cria só o ADMIN, que entra por e-mail e senha; nenhum vaqueiro fixo', async () => {
    const adminToken = await authHelper.login(ADMIN.email, ADMIN.password);
    expect(adminToken).toBeTruthy();

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe(ADMIN.email);
    expect(users[0].role).toBe(UserRole.ADMIN);
    expect(users[0].name).toBe('Admin Padrão');
  });

  it('guarda a senha com hash e nunca em texto puro', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN.email } });
    expect(admin.password).not.toBe(ADMIN.password);
    expect(admin.password).toMatch(/^\$2[aby]\$/);
  });

  it('o admin cria um vaqueiro e os dois enxergam o mesmo rebanho', async () => {
    const adminToken = await authHelper.login(ADMIN.email, ADMIN.password);
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN.email } });

    await testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(adminToken))
      .send({
        name: 'Vaqueiro Criado',
        email: 'vaqueiro.criado@example.com',
        password: 'VaqCriado@123',
        role: 'VAQUEIRO',
        userType: 'Pecuarista',
        userCategory: 'Fisica',
        city: 'Belo Jardim',
        state: 'PE',
      })
      .expect(HttpStatus.CREATED);
    const vaqueiro = await prisma.user.findUniqueOrThrow({ where: { email: 'vaqueiro.criado@example.com' } });
    expect(vaqueiro.adminId).toBe(admin.id);
    const vaqueiroToken = await authHelper.login('vaqueiro.criado@example.com', 'VaqCriado@123');

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

  it('é idempotente: subir de novo não duplica nem troca a senha da conta existente', async () => {
    const before = await prisma.user.findMany({ orderBy: { id: 'asc' } });

    process.env.DEFAULT_ADMIN_PASSWORD = 'OutraSenha@999';
    await testApp.getModule().get(DefaultAccountsService).ensureDefaultAccounts();

    const after = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    expect(after).toHaveLength(before.length);
    expect(after.map((u) => u.password)).toEqual(before.map((u) => u.password));
    process.env.DEFAULT_ADMIN_PASSWORD = ADMIN.password;
    await expect(authHelper.login(ADMIN.email, ADMIN.password)).resolves.toBeTruthy();
  });

  it('reativa o admin padrão desativado, sem trocar a senha', async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN.email } });
    await prisma.user.update({ where: { email: ADMIN.email }, data: { status: 'Inactive' } });
    await testApp
      .request()
      .post('/auth/login')
      .send({ email: ADMIN.email, password: ADMIN.password })
      .expect(HttpStatus.UNAUTHORIZED);

    await testApp.getModule().get(DefaultAccountsService).ensureDefaultAccounts();

    const after = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN.email } });
    expect(after.status).toBe('Active');
    expect(after.password).toBe(before.password);
    await expect(authHelper.login(ADMIN.email, ADMIN.password)).resolves.toBeTruthy();
  });

  /**
   * Em subidas simultâneas (duas chamadas no mesmo processo ou duas instâncias) a
   * conta não pode falhar com "Email já está em uso" nem consumir id da sequência
   * com um insert que ia falhar.
   */
  describe('corrida na criação da conta', () => {
    const accountsFrom = () => testApp.getModule().get(DefaultAccountsService);
    const listAdmins = () => prisma.user.findMany({ where: { email: ADMIN.email } });

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

    it('duas execuções simultâneas no mesmo processo criam a conta uma só vez', async () => {
      const accounts = accountsFrom();

      await Promise.all([accounts.ensureDefaultAccounts(), accounts.ensureDefaultAccounts()]);

      expect(await listAdmins()).toHaveLength(1);
      await expect(prisma.user.count()).resolves.toBe(1);
    });

    it('duas instâncias independentes subindo juntas em banco vazio terminam sem erro e com uma conta só', async () => {
      await expect(
        Promise.all([buildIndependentInstance().ensureDefaultAccounts(), buildIndependentInstance().ensureDefaultAccounts()]),
      ).resolves.toBeDefined();

      expect(await listAdmins()).toHaveLength(1);
      await expect(prisma.user.count()).resolves.toBe(1);
    });

    it('create que bate no e-mail já criado por outra instância segue sem erro, adota a conta e reativa a inativa sem trocar a senha', async () => {
      await accountsFrom().ensureDefaultAccounts();
      await prisma.user.updateMany({ where: { email: ADMIN.email }, data: { status: 'Inactive' } });
      const before = await listAdmins();

      // Esta instância ainda não "enxerga" a conta na primeira consulta (ela foi criada
      // por outra instância depois), então o `create` bate na unicidade do e-mail no
      // banco de verdade.
      const realRepository = testApp.getModule().get<IUserRepository>(IUserRepository);
      const alreadyLooked = new Set<string>();
      const lateRepository = Object.create(realRepository) as IUserRepository;
      lateRepository.findByEmail = async (email: string) => {
        if (alreadyLooked.has(email)) return realRepository.findByEmail(email);
        alreadyLooked.add(email);
        return null;
      };

      await expect(buildIndependentInstance(lateRepository).ensureDefaultAccounts()).resolves.toBeUndefined();

      const after = await listAdmins();
      expect(after.map((u) => u.id)).toEqual(before.map((u) => u.id));
      expect(after.map((u) => u.password)).toEqual(before.map((u) => u.password));
      expect(after.every((u) => u.status === 'Active')).toBe(true);
      await expect(prisma.user.count()).resolves.toBe(1);
    });
  });
});

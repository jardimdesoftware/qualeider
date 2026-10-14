import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT, prisma } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AnimalFactory, DailyCollectionFactory, UserFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';
import { AccountPurgeService, ACCOUNT_PURGE_TASK } from '@/application/services/users/account-purge.service';
import { DefaultAccountsService } from '@/application/services/users/default-accounts.service';

/**
 * Limpeza única: remove todas as contas e os dados delas, menos as duas contas
 * padrão, e nunca repete (o deploy reinicia a API a cada poucas horas).
 */
describe('E2E: Limpeza única de contas (todas, menos as padrão)', () => {
  const KEEP_ADMIN = 'limpeza.admin@example.com';
  const KEEP_VAQUEIRO = 'limpeza.vaqueiro@example.com';
  const ENV_KEYS = [
    'DEFAULT_ADMIN_EMAIL',
    'DEFAULT_ADMIN_PASSWORD',
    'DEFAULT_VAQUEIRO_EMAIL',
    'DEFAULT_VAQUEIRO_PASSWORD',
  ];

  let testApp: TestApp;
  let authHelper: AuthHelper;
  let purge: AccountPurgeService;
  let defaults: DefaultAccountsService;
  let keepAdminId: number;
  let keepAnimalId: number;
  let strangerAnimalId: number;

  const post = (path: string, token: string, body: object) =>
    testApp.request().post(path).set(authHelper.authHeader(token)).send(body).expect(HttpStatus.CREATED);

  beforeAll(async () => {
    await setupE2ETests();
    process.env.DEFAULT_ADMIN_EMAIL = KEEP_ADMIN;
    process.env.DEFAULT_ADMIN_PASSWORD = 'AdminLimpa@123';
    process.env.DEFAULT_VAQUEIRO_EMAIL = KEEP_VAQUEIRO;
    process.env.DEFAULT_VAQUEIRO_PASSWORD = 'VaqLimpa@123';
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);
    purge = testApp.getModule().get(AccountPurgeService);
    defaults = testApp.getModule().get(DefaultAccountsService);

    keepAdminId = (await prisma.user.findUniqueOrThrow({ where: { email: KEEP_ADMIN } })).id;
    const keepToken = await authHelper.login(KEEP_ADMIN, 'AdminLimpa@123');

    // Dois "estranhos" com funcionário, animais (filha apontando para a mãe) e coleta.
    const strangers: { id: number; token: string }[] = [];
    for (const n of [1, 2]) {
      const a = await authHelper.createUserAndLogin(
        UserFactory.buildAdmin({ email: `estranho${n}@example.com`, password: 'Estranho@123' }),
      );
      strangers.push({ id: a.user.id!, token: a.token });
      await post('/users/internal', a.token, UserFactory.build({ email: `func${n}@example.com`, password: 'Func@12345', role: 'VAQUEIRO' as never }));
      const mother = await post('/animals', a.token, AnimalFactory.build({ name: `Mae${n}`, userId: a.user.id! }));
      const motherId = mother.body.data.id as number;
      if (n === 1) strangerAnimalId = motherId;
      await post('/animals', a.token, AnimalFactory.build({ name: `Filha${n}`, userId: a.user.id!, motherId } as never));
      await post('/daily-collections', a.token, DailyCollectionFactory.build({ userId: a.user.id!, quantity: 20, items: [{ animalId: motherId, quantity: 20 }] }));
      await post('/allowed-emails', a.token, { email: `fora${n}@gmail.com` });
    }

    // Animal da conta que fica, com a mãe sendo um animal que será apagado.
    const keepAnimal = await post('/animals', keepToken, AnimalFactory.build({ name: 'Animal da conta padrao', userId: keepAdminId }));
    keepAnimalId = keepAnimal.body.data.id as number;
    await prisma.animal.update({ where: { id: keepAnimalId }, data: { motherId: strangerAnimalId } });

    await prisma.association.create({
      data: {
        name: 'Assoc', tradeName: 'Assoc', cnpj: '11.111.111/0001-11', email: 'assoc@example.com', password: 'x',
        landlinePhone: '1', zipCode: '1', state: 'PE', city: 'C', street: 'R', number: '1', neighborhood: 'B',
        coverageArea: 'Estadual', presidentName: 'P', presidentCpf: '1', presidentEmail: 'p@example.com', presidentPhone: '1',
      } as never,
    });
  }, E2E_TIMEOUT * 4);

  afterAll(async () => {
    if (testApp) await testApp.close();
    for (const key of ENV_KEYS) delete process.env[key];
    await teardownE2ETests();
  });

  it('não apaga nada se uma das contas padrão não existe', async () => {
    const usersBefore = await prisma.user.count();
    await prisma.user.delete({ where: { email: KEEP_VAQUEIRO } });

    const result = await purge.purgeOnce();

    expect(result.status).toBe('skipped');
    expect(await prisma.user.count()).toBe(usersBefore - 1);
    expect(await prisma.oneOffTask.count()).toBe(0);

    await defaults.ensureDefaultAccounts(); // recria a conta padrão que faltava
    expect(await prisma.user.count()).toBe(usersBefore);
  });

  it('apaga todas as contas e dados, mantendo só as duas padrão', async () => {
    const result = await purge.purgeOnce();

    expect(result.status).toBe('done');
    const emails = (await prisma.user.findMany({ select: { email: true } })).map((u) => u.email).sort();
    expect(emails).toEqual([KEEP_ADMIN, KEEP_VAQUEIRO].sort());
    expect(await prisma.association.count()).toBe(0);
    expect(await prisma.allowedEmail.count()).toBe(0);
    expect(await prisma.dailyCollection.count()).toBe(0);
    expect(await prisma.oneOffTask.findUnique({ where: { name: ACCOUNT_PURGE_TASK } })).not.toBeNull();
  });

  it('preserva o animal da conta padrão e solta a referência à mãe apagada', async () => {
    const animals = await prisma.animal.findMany();
    expect(animals).toHaveLength(1);
    expect(animals[0].id).toBe(keepAnimalId);
    expect(animals[0].motherId).toBeNull();
  });

  it('as contas padrão continuam entrando e as apagadas não entram mais', async () => {
    await expect(authHelper.login(KEEP_ADMIN, 'AdminLimpa@123')).resolves.toBeTruthy();
    await testApp
      .request()
      .post('/auth/login')
      .send({ email: 'estranho1@example.com', password: 'Estranho@123' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('nunca repete: quem se cadastra depois sobrevive a uma nova subida', async () => {
    await authHelper.createUserAndLogin(UserFactory.buildAdmin({ email: 'novo@example.com', password: 'Novo@12345' }));

    const result = await purge.purgeOnce();

    expect(result.status).toBe('skipped');
    expect(result.reason).toMatch(/ja executada/);
    expect(await prisma.user.findUnique({ where: { email: 'novo@example.com' } })).not.toBeNull();
  });
});

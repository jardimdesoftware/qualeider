import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AssociationFactory, UserFactory } from '../factories';
import { UserCategory, UserRole } from '@/domain/enums/enums';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * POST /notifications/send não tinha autorização: qualquer usuário logado
 * mandava e-mail (com a identidade do sistema e texto livre) para todos os
 * membros de QUALQUER associação. Agora só a própria associação, ou um ADMIN
 * dela, notifica seus membros. E só o destinatário marca a notificação como lida.
 */
describe('E2E: Notificações — quem pode enviar e ler', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;

  let assocA: { id: number; token: string };
  let assocB: { id: number; token: string };
  let attackerToken: string;
  let adminOfAToken: string;
  let adminOfBToken: string;
  let vaqueiroOfAToken: string;
  let vaqueiroOfAId: number;

  const payload = (associationId: number) => ({
    type: 'Collective',
    associationId,
    subject: 'Aviso importante',
    message: 'Mensagem de teste com mais de dez caracteres.',
  });
  const send = (token: string | undefined, associationId: number) => {
    const req = testApp.request().post('/notifications/send');
    if (token) req.set(authHelper.authHeader(token));
    return req.send(payload(associationId));
  };

  const createAssociation = async () => {
    const data = AssociationFactory.build();
    const created = await testApp.request().post('/associations').send(data).expect(HttpStatus.CREATED);
    return { id: created.body.data.id as number, token: await authHelper.login(data.email!, data.password!) };
  };

  // Membros são criados direto no banco: o caminho público não deve escolher associação.
  const createMember = async (email: string, role: UserRole, associationId: number) => {
    const user = await testApp.getPrismaService().user.create({
      data: {
        name: email,
        email,
        password: await bcrypt.hash('Membro@1234', 4),
        userCategory: UserCategory.Fisica,
        city: 'Recife',
        state: 'PE',
        role,
        associationId,
      },
    });
    return { id: user.id, token: await authHelper.login(email, 'Membro@1234') };
  };

  const notificationsOf = (associationId: number) =>
    testApp.getPrismaService().notification.count({ where: { associationId } });

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    assocA = await createAssociation();
    assocB = await createAssociation();

    attackerToken = (
      await authHelper.createUserAndLogin(
        UserFactory.buildAdmin({ email: 'notif-atacante@example.com', password: 'Atk@123456' }),
      )
    ).token;
    adminOfAToken = (await createMember('notif-admin-a@example.com', UserRole.ADMIN, assocA.id)).token;
    adminOfBToken = (await createMember('notif-admin-b@example.com', UserRole.ADMIN, assocB.id)).token;
    const vaqueiroA = await createMember('notif-vaq-a@example.com', UserRole.VAQUEIRO, assocA.id);
    vaqueiroOfAToken = vaqueiroA.token;
    vaqueiroOfAId = vaqueiroA.id;
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('POST /notifications/send', () => {
    it('sem login: 401', async () => {
      await send(undefined, assocA.id).expect(HttpStatus.UNAUTHORIZED);
    });

    it.each([
      ['usuário sem associação (o atacante)', () => attackerToken],
      ['ADMIN de OUTRA associação', () => adminOfBToken],
      ['funcionário (VAQUEIRO) da própria associação', () => vaqueiroOfAToken],
      ['outra associação', () => assocB.token],
    ])('%s: 403 e nenhuma notificação é criada', async (_label, tokenOf) => {
      const before = await notificationsOf(assocA.id);

      await send(tokenOf(), assocA.id).expect(HttpStatus.FORBIDDEN);

      expect(await notificationsOf(assocA.id)).toBe(before);
    });

    it('a própria associação notifica os seus membros: 201', async () => {
      const before = await notificationsOf(assocA.id);

      await send(assocA.token, assocA.id).expect(HttpStatus.CREATED);

      expect(await notificationsOf(assocA.id)).toBe(before + 1);
    });

    it('um ADMIN da associação notifica os membros: 201', async () => {
      await send(adminOfAToken, assocA.id).expect(HttpStatus.CREATED);
    });
  });

  describe('POST /notifications/read/:id', () => {
    let recipientId: number;

    beforeAll(async () => {
      const mine = await testApp
        .request()
        .get('/notifications/user/me')
        .set(authHelper.authHeader(vaqueiroOfAToken))
        .expect(HttpStatus.OK);
      recipientId = mine.body.data[0].id;
    });

    it('outro usuário não marca a notificação alheia como lida (404) e ela continua não lida', async () => {
      await testApp
        .request()
        .post(`/notifications/read/${recipientId}`)
        .set(authHelper.authHeader(attackerToken))
        .expect(HttpStatus.NOT_FOUND);

      const row = await testApp.getPrismaService().notificationRecipient.findUniqueOrThrow({ where: { id: recipientId } });
      expect(row.read).toBe(false);
      expect(row.userId).toBe(vaqueiroOfAId);
    });

    it('id que não é número: 400', async () => {
      await testApp
        .request()
        .post('/notifications/read/abc')
        .set(authHelper.authHeader(vaqueiroOfAToken))
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('o destinatário marca a própria notificação como lida', async () => {
      await testApp
        .request()
        .post(`/notifications/read/${recipientId}`)
        .set(authHelper.authHeader(vaqueiroOfAToken))
        .expect(HttpStatus.CREATED);

      const row = await testApp.getPrismaService().notificationRecipient.findUniqueOrThrow({ where: { id: recipientId } });
      expect(row.read).toBe(true);
    });
  });
});

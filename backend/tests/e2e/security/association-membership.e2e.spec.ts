import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AssociationFactory, UserFactory } from '../factories';
import { UserCategory, UserRole } from '@/domain/enums/enums';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * Entrar numa associação dá acesso aos dados dela (o escopo do rebanho é por
 * associação). O cadastro público aceitava `associationId`, então qualquer
 * visitante se declarava membro de uma associação qualquer. O vínculo agora só
 * nasce de convite aceito ou de quem administra a associação.
 */
describe('E2E: Vínculo com associação — ninguém escolhe a associação sozinho', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let assocAId: number;
  let assocBId: number;
  let adminOfAToken: string;
  let adminWithoutAssocToken: string;

  const prisma = () => testApp.getPrismaService();
  const associationOf = async (email: string) =>
    (await prisma().user.findUniqueOrThrow({ where: { email } })).associationId;

  const createAssociation = async () => {
    const created = await testApp.request().post('/associations').send(AssociationFactory.build()).expect(HttpStatus.CREATED);
    return created.body.data.id as number;
  };

  const internal = (token: string, email: string, associationId: number) =>
    testApp
      .request()
      .post('/users/internal')
      .set(authHelper.authHeader(token))
      .send(UserFactory.build({ email, role: UserRole.VAQUEIRO, associationId }));

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    assocAId = await createAssociation();
    assocBId = await createAssociation();

    adminWithoutAssocToken = (
      await authHelper.createUserAndLogin(
        UserFactory.buildAdmin({ email: 'vinc-admin-sem@example.com', password: 'Admin@12345' }),
      )
    ).token;

    await prisma().user.create({
      data: {
        name: 'Admin da A',
        email: 'vinc-admin-a@example.com',
        password: await bcrypt.hash('Admin@12345', 4),
        userCategory: UserCategory.Juridica,
        city: 'Recife',
        state: 'PE',
        role: UserRole.ADMIN,
        associationId: assocAId,
      },
    });
    adminOfAToken = await authHelper.login('vinc-admin-a@example.com', 'Admin@12345');
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('cadastro público (POST /users)', () => {
    it('ignora o associationId do corpo: o usuário nasce sem associação', async () => {
      const intruder = UserFactory.build({ email: 'vinc-intruso@example.com', associationId: assocAId });

      await testApp.request().post('/users').send(intruder).expect(HttpStatus.CREATED);

      expect(await associationOf('vinc-intruso@example.com')).toBeNull();
    });
  });

  describe('cadastro interno de funcionário (POST /users/internal)', () => {
    it('admin sem associação não vincula o funcionário a nenhuma', async () => {
      await internal(adminWithoutAssocToken, 'vinc-func-1@example.com', assocAId).expect(HttpStatus.CREATED);

      expect(await associationOf('vinc-func-1@example.com')).toBeNull();
    });

    it('admin da associação A não vincula o funcionário à associação B', async () => {
      await internal(adminOfAToken, 'vinc-func-2@example.com', assocBId).expect(HttpStatus.CREATED);

      expect(await associationOf('vinc-func-2@example.com')).toBeNull();
    });

    it('admin da associação A vincula o funcionário à própria associação A', async () => {
      await internal(adminOfAToken, 'vinc-func-3@example.com', assocAId).expect(HttpStatus.CREATED);

      expect(await associationOf('vinc-func-3@example.com')).toBe(assocAId);
    });
  });

  describe('edição de funcionário (PUT/PATCH /users/:id)', () => {
    let ownEmployeeId: number;

    beforeAll(async () => {
      const created = await internal(adminWithoutAssocToken, 'vinc-func-4@example.com', assocAId).expect(HttpStatus.CREATED);
      ownEmployeeId = created.body.data.id;
    });

    it.each(['put', 'patch'] as const)('%s: admin não encaixa o funcionário numa associação alheia (403)', async (method) => {
      await testApp
        .request()
        [method](`/users/${ownEmployeeId}`)
        .set(authHelper.authHeader(adminWithoutAssocToken))
        .send({ associationId: assocBId })
        .expect(HttpStatus.FORBIDDEN);

      expect(await associationOf('vinc-func-4@example.com')).toBeNull();
    });

    it('edições comuns (sem associationId) continuam funcionando', async () => {
      await testApp
        .request()
        .patch(`/users/${ownEmployeeId}`)
        .set(authHelper.authHeader(adminWithoutAssocToken))
        .send({ name: 'Nome Novo' })
        .expect(HttpStatus.OK);
    });
  });
});

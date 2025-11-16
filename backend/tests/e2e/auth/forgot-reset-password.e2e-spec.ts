import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory } from '../factories';

describe('E2E: Auth - Forgot/Reset Password', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let userEmail: string;
  let resetToken: string;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);
  });

  afterAll(async () => {
    await testApp.close();
    await teardownE2ETests();
  });

  describe('POST /auth/forgot-password', () => {
    beforeAll(async () => {
      const userData = UserFactory.build({
        email: 'forgot-test@example.com',
        password: 'OldPassword@123',
      });
      await authHelper.createTestUser(userData);
      userEmail = userData.email!;
    });

    it('deve enviar email de recuperação com email válido', async () => {
      const response = await testApp
        .request()
        .post('/auth/forgot-password')
        .send({ email: userEmail })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('enviado');
    });

    it('deve retornar 404 com email inexistente', async () => {
      await testApp
        .request()
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);
    });

    it('deve retornar 400 com email inválido', async () => {
      await testApp
        .request()
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);
    });

    it('deve retornar 400 sem email', async () => {
      await testApp
        .request()
        .post('/auth/forgot-password')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/validate-reset-token', () => {
    beforeAll(async () => {
      // Gerar token de reset válido
      const prisma = testApp.getPrismaService();
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (user) {
        // Gerar token simples para testes
        const crypto = require('crypto');
        resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date();
        resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: resetToken,
            resetTokenExpiry: resetTokenExpires,
          },
        });
      }
    });

    it('deve validar token válido', async () => {
      const response = await testApp
        .request()
        .post('/auth/validate-reset-token')
        .send({
          email: userEmail,
          token: resetToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('message', 'Token válido.');
    });

    it('deve retornar 401 com token inválido', async () => {
      await testApp
        .request()
        .post('/auth/validate-reset-token')
        .send({
          email: userEmail,
          token: 'invalid-token-123',
        })
        .expect(401);
    });

    it('deve retornar 404 com email inexistente', async () => {
      await testApp
        .request()
        .post('/auth/validate-reset-token')
        .send({
          email: 'nonexistent@example.com',
          token: resetToken,
        })
        .expect(404);
    });

    it('deve retornar 401 com token expirado', async () => {
      // Criar token expirado
      const prisma = testApp.getPrismaService();
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (user) {
        const expiredToken = 'expired-token-123';
        const pastDate = new Date();
        pastDate.setHours(pastDate.getHours() - 2); // 2 horas no passado

        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: expiredToken,
            resetTokenExpiry: pastDate,
          },
        });

        await testApp
          .request()
          .post('/auth/validate-reset-token')
          .send({
            email: userEmail,
            token: expiredToken,
          })
          .expect(401);

        // Restaurar token válido
        const resetTokenExpires = new Date();
        resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: resetToken,
            resetTokenExpiry: resetTokenExpires,
          },
        });
      }
    });
  });

  describe('POST /auth/reset-password', () => {
    it('deve redefinir senha com token válido', async () => {
      const newPassword = 'NewPassword@123';

      const response = await testApp
        .request()
        .post('/auth/reset-password')
        .send({
          email: userEmail,
          token: resetToken,
          newPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('redefinida com sucesso');

      // Verificar que pode fazer login com nova senha
      const loginResponse = await testApp
        .request()
        .post('/auth/login')
        .send({
          email: userEmail,
          password: newPassword,
        })
        .expect(201);

      expect(loginResponse.body).toHaveProperty('access_token');
    });

    it('deve retornar 401 com token inválido', async () => {
      await testApp
        .request()
        .post('/auth/reset-password')
        .send({
          email: userEmail,
          token: 'invalid-token',
          newPassword: 'NewPass@123',
        })
        .expect(401);
    });

    it('deve retornar 401 com token já usado', async () => {
      // Tentar usar o mesmo token novamente
      await testApp
        .request()
        .post('/auth/reset-password')
        .send({
          email: userEmail,
          token: resetToken,
          newPassword: 'AnotherPass@123',
        })
        .expect(401);
    });

    it('deve retornar 400 com senha muito curta', async () => {
      // Gerar novo token
      const prisma = testApp.getPrismaService();
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (user) {
        const newToken = 'new-token-123';
        const resetTokenExpires = new Date();
        resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: newToken,
            resetTokenExpiry: resetTokenExpires,
          },
        });

        await testApp
          .request()
          .post('/auth/reset-password')
          .send({
            email: userEmail,
            token: newToken,
            newPassword: '123', // Muito curta
          })
          .expect(400);
      }
    });

    it('deve retornar 404 com email inexistente', async () => {
      await testApp
        .request()
        .post('/auth/reset-password')
        .send({
          email: 'nonexistent@example.com',
          token: 'any-token',
          newPassword: 'ValidPass@123',
        })
        .expect(404);
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      await testApp.request().post('/auth/reset-password').send({}).expect(400);
    });
  });

  describe('Fluxo completo: Forgot → Validate → Reset', () => {
    it('deve completar fluxo de recuperação de senha', async () => {
      // 1. Criar novo usuário
      const userData = UserFactory.build({
        email: 'flow-test@example.com',
        password: 'OriginalPass@123',
      });
      await authHelper.createTestUser(userData);

      // 2. Solicitar recuperação de senha
      const forgotResponse = await testApp
        .request()
        .post('/auth/forgot-password')
        .send({ email: userData.email })
        .expect(201);

      expect(forgotResponse.body.message).toContain('enviado');

      // 3. Simulando recebimento de email
      const prisma = testApp.getPrismaService();
      const user = await prisma.user.findUnique({
        where: { email: userData.email! },
      });

      expect(user).toBeDefined();
      expect(user!.resetToken).toBeDefined();
      expect(user!.resetTokenExpiry).toBeDefined();

      const token = user!.resetToken!;

      // 4. Validar token
      const validateResponse = await testApp
        .request()
        .post('/auth/validate-reset-token')
        .send({
          email: userData.email,
          token,
        })
        .expect(200);

      expect(validateResponse.body.valid).toBe(true);

      // 5. Redefinir senha
      const newPassword = 'BrandNewPass@123';
      const resetResponse = await testApp
        .request()
        .post('/auth/reset-password')
        .send({
          email: userData.email,
          token,
          newPassword,
        })
        .expect(200);

      expect(resetResponse.body.message).toContain('redefinida com sucesso');

      // 6. Verificar que senha antiga não funciona mais
      await testApp
        .request()
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(401);

      // 7. Verificar que nova senha funciona
      const loginResponse = await testApp
        .request()
        .post('/auth/login')
        .send({
          email: userData.email,
          password: newPassword,
        })
        .expect(201);

      expect(loginResponse.body).toHaveProperty('access_token');

      // 8. Verificar que token foi limpo
      const updatedUser = await prisma.user.findUnique({
        where: { email: userData.email! },
      });

      expect(updatedUser!.resetToken).toBeNull();
      expect(updatedUser!.resetTokenExpiry).toBeNull();
    });
  });
});

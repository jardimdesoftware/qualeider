import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { UserFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

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
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.OK);
      expect(response.body.message).toContain('receberá um link');
    });

    it('deve retornar 404 com email inexistente', async () => {
      await testApp
        .request()
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 400 com email inválido', async () => {
      await testApp
        .request()
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 sem email', async () => {
      await testApp
        .request()
        .post('/auth/forgot-password')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/validate-reset-token', () => {
    beforeAll(async () => {
      // Ensure we have a user for this test block
      if (!userEmail) {
        const userData = UserFactory.build({
          email: 'validate-test@example.com',
          password: 'Password@123',
        });
        await authHelper.createTestUser(userData);
        userEmail = userData.email!;
      }

      const prisma = testApp.getPrismaService();
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (user) {
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
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.OK);
      expect(response.body.data).toHaveProperty('valid', true);
      expect(response.body.message).toBe('Token válido');
    });

    it('deve retornar 401 com token inválido', async () => {
      await testApp
        .request()
        .post('/auth/validate-reset-token')
        .send({
          email: userEmail,
          token: 'invalid-token-123',
        })
        .expect(HttpStatus.UNAUTHORIZED);
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
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('statusCode', HttpStatus.OK);
      expect(response.body.message).toContain('redefinida com sucesso');

      const loginResponse = await testApp
        .request()
        .post('/auth/login')
        .send({
          email: userEmail,
          password: newPassword,
        })
        .expect(HttpStatus.OK);

      expect(loginResponse.body.data).toHaveProperty('access_token');
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
        .expect(HttpStatus.UNAUTHORIZED);
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
        .expect(HttpStatus.NOT_FOUND);
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      await testApp.request().post('/auth/reset-password').send({}).expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Fluxo completo: Forgot → Validate → Reset', () => {
    it('deve completar fluxo de recuperação de senha', async () => {
      const userData = UserFactory.build({
        email: 'flow-test@example.com',
        password: 'OriginalPass@123',
      });
      await authHelper.createTestUser(userData);

      const forgotResponse = await testApp
        .request()
        .post('/auth/forgot-password')
        .send({ email: userData.email })
        .expect(HttpStatus.OK);

      expect(forgotResponse.body.message).toContain('receberá um link');

      const prisma = testApp.getPrismaService();
      const user = await prisma.user.findUnique({
        where: { email: userData.email! },
      });

      expect(user).toBeDefined();
      expect(user!.resetToken).toBeDefined();
      const token = user!.resetToken!;

      const validateResponse = await testApp
        .request()
        .post('/auth/validate-reset-token')
        .send({
          email: userData.email,
          token,
        })
        .expect(HttpStatus.OK);

      expect(validateResponse.body.data.valid).toBe(true);

      const newPassword = 'BrandNewPass@123';
      const resetResponse = await testApp
        .request()
        .post('/auth/reset-password')
        .send({
          email: userData.email,
          token,
          newPassword,
        })
        .expect(HttpStatus.OK);

      expect(resetResponse.body.message).toContain('redefinida com sucesso');

      await testApp
        .request()
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(HttpStatus.UNAUTHORIZED);

      const loginResponse = await testApp
        .request()
        .post('/auth/login')
        .send({
          email: userData.email,
          password: newPassword,
        })
        .expect(HttpStatus.OK);

      expect(loginResponse.body.data).toHaveProperty('access_token');

      const updatedUser = await prisma.user.findUnique({
        where: { email: userData.email! },
      });

      expect(updatedUser!.resetToken).toBeNull();
      expect(updatedUser!.resetTokenExpiry).toBeNull();
    });
  });
});
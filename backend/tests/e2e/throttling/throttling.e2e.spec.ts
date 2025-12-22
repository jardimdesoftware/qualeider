import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp } from '../helpers';
import { UserFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

const randomIP = () => 
  `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

describe('E2E: Rate Limiting (Throttling)', () => {
  let testApp: TestApp;

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) {
      await testApp.close();
    }
    await teardownE2ETests();
  });

  describe('POST /auth/login - 3 requests / 2s (test env)', () => {
    it('deve permitir 3 tentativas de login sem bloqueio', async () => {
      const fakeIP = randomIP(); // IP único para este teste
      const credentials = {
        email: `test-throttle-${Date.now()}@example.com`,
        password: 'WrongPassword123',
      };

      // Fazer 3 requisições com credenciais inválidas
      // Todas devem retornar 401 (não 429)
      for (let i = 1; i <= 3; i++) {
        const response = await testApp
          .throttledRequest() // 👈 USO DO MÉTODO SEM BYPASS
          .post('/auth/login')
          .set('X-Forwarded-For', fakeIP) // Simula IP específico
          .send(credentials);

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(response.body.statusCode).toBe(401);
      }
    });

    it('deve bloquear 4ª tentativa com HTTP 429', async () => {
      const fakeIP = randomIP(); // IP único para este teste
      const credentials = {
        email: `test-throttle-429-${Date.now()}@example.com`,
        password: 'WrongPassword123',
      };

      // Fazer 3 requisições válidas
      for (let i = 1; i <= 3; i++) {
        await testApp
          .throttledRequest() // 👈 USO DO MÉTODO SEM BYPASS
          .post('/auth/login')
          .set('X-Forwarded-For', fakeIP)
          .send(credentials);
      }

      // 4ª requisição deve ser bloqueada
      const response = await testApp
        .throttledRequest() // 👈 USO DO MÉTODO SEM BYPASS
        .post('/auth/login')
        .set('X-Forwarded-For', fakeIP) // Mesmo IP do loop acima
        .send(credentials);

      expect(response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(response.body.statusCode).toBe(429);
      
      expect(response.headers).toHaveProperty('retry-after');
    });

    it('deve resetar limite após TTL (2 segundos em test)', async () => {
      const fakeIP = randomIP();
      const credentials = {
        email: `test-throttle-reset-${Date.now()}@example.com`,
        password: 'WrongPassword123',
      };

      // Fazer 3 requisições para atingir o limite
      for (let i = 1; i <= 3; i++) {
        await testApp
          .throttledRequest()
          .post('/auth/login')
          .set('X-Forwarded-For', fakeIP)
          .send(credentials);
      }

      // Aguardar TTL + margem de segurança (2.1 segundos)
      await wait(2100);

      // Nova requisição deve passar (limite resetado)
      const response = await testApp
        .throttledRequest()
        .post('/auth/login')
        .set('X-Forwarded-For', fakeIP) // Mesmo IP, mas após reset
        .send(credentials);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('POST /users - 5 requests / 2s (test env)', () => {
    it('deve permitir 5 criações de usuário sem bloqueio', async () => {
      const fakeIP = randomIP(); 
      
      // Fazer 5 requisições
      for (let i = 1; i <= 5; i++) {
        const userData = UserFactory.build({
          email: `throttle-user-${Date.now()}-${i}@example.com`,
          password: 'Test@1234',
        });

        const response = await testApp
          .throttledRequest() // 👈 USO DO MÉTODO SEM BYPASS
          .post('/users')
          .set('X-Forwarded-For', fakeIP)
          .send(userData);

        // Deve passar (201 ou 409 se email duplicado por timing)
        expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(response.status);
      }
    });

    it('deve bloquear 6ª criação de usuário com HTTP 429', async () => {
      const fakeIP = randomIP(); 
      
      // Fazer 5 requisições para atingir o limite
      for (let i = 1; i <= 5; i++) {
        const userData = UserFactory.build({
          email: `throttle-user-429-${Date.now()}-${i}@example.com`,
          password: 'Test@1234',
        });

        await testApp
          .throttledRequest()
          .post('/users')
          .set('X-Forwarded-For', fakeIP)
          .send(userData);
        
        // Add small delay to ensure rate limiter tracks each request
        await wait(50);
      }

      // 6ª requisição deve ser bloqueada
      const userData = UserFactory.build({
        email: `throttle-user-429-${Date.now()}-6@example.com`,
        password: 'Test@1234',
      });

      const response = await testApp
        .throttledRequest()
        .post('/users')
        .set('X-Forwarded-For', fakeIP)
        .send(userData);

      expect(response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(response.body.statusCode).toBe(429);
    });
  });

  describe('POST /associations - 5 requests / 2s (test env)', () => {
    it('deve bloquear 6ª criação de associação com HTTP 429', async () => {
      const fakeIP = randomIP();
      
      // Fazer 5 requisições
      for (let i = 1; i <= 5; i++) {
        const assocData = {
          fullName: `Test Association ${Date.now()}-${i}`,
          email: `throttle-assoc-${Date.now()}-${i}@example.com`,
          password: 'Test@1234',
          cnpj: `${12345678000100 + i}`,
          city: 'São Paulo',
          state: 'SP',
        };

        await testApp
          .throttledRequest()
          .post('/associations')
          .set('X-Forwarded-For', fakeIP)
          .send(assocData);
      }

      // 6ª deve ser bloqueada
      const assocData = {
        fullName: `Test Association ${Date.now()}-6`,
        email: `throttle-assoc-${Date.now()}-6@example.com`,
        password: 'Test@1234',
        cnpj: '12345678000199',
        city: 'São Paulo',
        state: 'SP',
      };

      const response = await testApp
        .throttledRequest()
        .post('/associations')
        .set('X-Forwarded-For', fakeIP)
        .send(assocData);

      expect(response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });

  describe('Validação de Headers HTTP 429', () => {
    it('deve incluir todos os headers de rate limit na resposta 429', async () => {
      const fakeIP = randomIP();
      const credentials = {
        email: `test-headers-${Date.now()}@example.com`,
        password: 'Wrong',
      };

      // Atingir o limite (3 requisições)
      for (let i = 1; i <= 3; i++) {
        await testApp
          .throttledRequest()
          .post('/auth/login')
          .set('X-Forwarded-For', fakeIP)
          .send(credentials);
      }

      // Requisição bloqueada
      const response = await testApp
        .throttledRequest()
        .post('/auth/login')
        .set('X-Forwarded-For', fakeIP)
        .send(credentials)
        .expect(429);

      // Validar headers
      expect(response.headers['retry-after']).toBeDefined();
      expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
    });
  });
});
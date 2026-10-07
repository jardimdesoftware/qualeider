import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { MailService } from '@/mail/mail.service';
import { MockMailService } from '../../mocks/mail.mock';
import { buildCorsOptions, createHelmetMiddleware } from '@/presentation/security.config';

/**
 * CORS e CSP da API, montados pelo mesmo código que o main.ts usa
 * (security.config.ts), sobre o AppModule real.
 *
 * Relatório de pentest 3.7 (CORS com Allow-Credentials) e 3.2 (CSP da API com
 * 'unsafe-eval'/'unsafe-inline').
 */
async function buildApp(rawOrigins: string | undefined, isProduction: boolean): Promise<INestApplication> {
  process.env.TEST_THROTTLING = 'true';
  const { AppModule } = await import('@/presentation/app.module');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useClass(MockMailService)
    .compile();

  const app = moduleRef.createNestApplication();
  app.use(createHelmetMiddleware());
  app.enableCors(buildCorsOptions(rawOrigins, isProduction).options);
  // O Swagger real só é montado no main.ts; uma rota no mesmo caminho basta
  // para exercitar a CSP específica dele.
  app.getHttpAdapter().get('/api-docs', (_req: unknown, res: any) => res.send('<html>swagger</html>'));
  await app.init();
  return app;
}

const SITE = 'https://qualeider.valerialima.me';
const EVIL = 'https://evil.example';

// x-e2e-bypass: evita o throttler nestas verificações de cabeçalho.
const get = (app: INestApplication, path: string, origin?: string) => {
  const req = request(app.getHttpServer()).get(path).set('x-e2e-bypass', 'true');
  return origin ? req.set('Origin', origin) : req;
};

describe('E2E: CORS e CSP da API', () => {
  describe('produção com CORS_ORIGINS="https://qualeider.valerialima.me/" (barra final de propósito)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await buildApp(`${SITE}/`, true);
    });
    afterAll(async () => {
      await app.close();
    });

    it('origem listada recebe Allow-Origin e NÃO recebe Allow-Credentials', async () => {
      const response = await get(app, '/health', SITE).expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(SITE);
      expect(response.headers).not.toHaveProperty('access-control-allow-credentials');
      expect(response.headers['vary']).toMatch(/Origin/i);
    });

    it('origem não listada não recebe Allow-Origin', async () => {
      const response = await get(app, '/health', EVIL).expect(200);

      expect(response.headers).not.toHaveProperty('access-control-allow-origin');
      expect(response.headers).not.toHaveProperty('access-control-allow-credentials');
    });

    it('localhost:3000 não é liberado automaticamente em produção', async () => {
      const response = await get(app, '/health', 'http://localhost:3000').expect(200);

      expect(response.headers).not.toHaveProperty('access-control-allow-origin');
    });

    it('preflight de origem listada é aceito, com os métodos da API', async () => {
      const response = await request(app.getHttpServer())
        .options('/animals')
        .set('Origin', SITE)
        .set('Access-Control-Request-Method', 'PUT')
        .set('x-e2e-bypass', 'true');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(SITE);
      expect(response.headers['access-control-allow-methods']).toContain('PUT');
      expect(response.headers).not.toHaveProperty('access-control-allow-credentials');
    });

    it('preflight de origem não listada não recebe Allow-Origin', async () => {
      const response = await request(app.getHttpServer())
        .options('/animals')
        .set('Origin', EVIL)
        .set('Access-Control-Request-Method', 'PUT')
        .set('x-e2e-bypass', 'true');

      expect(response.headers).not.toHaveProperty('access-control-allow-origin');
    });

    it('respostas JSON da API levam CSP mínima (default-src none), sem unsafe-eval/unsafe-inline', async () => {
      const csp = (await get(app, '/health').expect(200)).headers['content-security-policy'];

      expect(csp).toBe("default-src 'none';base-uri 'none';form-action 'none';frame-ancestors 'none'");
      expect(csp).not.toMatch(/unsafe-eval|unsafe-inline/);
    });

    it('o Swagger UI recebe a própria CSP: scripts só da mesma origem, sem unsafe-eval/unsafe-inline', async () => {
      const csp: string = (await get(app, '/api-docs').expect(200)).headers['content-security-policy'];
      const scriptSrc = csp.split(';').find((d) => d.startsWith('script-src '));

      expect(scriptSrc).toBe("script-src 'self'");
      expect(csp).not.toMatch(/unsafe-eval/);
      expect(csp).not.toContain('upgrade-insecure-requests');
    });

    it('demais headers do Helmet continuam presentes', async () => {
      const { headers } = await get(app, '/health').expect(200);

      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['strict-transport-security']).toMatch(/max-age=\d+/);
      expect(headers['x-xss-protection']).toBe('0');
      expect(headers).not.toHaveProperty('x-powered-by');
    });
  });

  describe('produção com CORS_ORIGINS="*"', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await buildApp('*', true);
    });
    afterAll(async () => {
      await app.close();
    });

    it('o curinga é ignorado: nenhuma origem recebe Allow-Origin', async () => {
      const response = await get(app, '/health', EVIL).expect(200);

      expect(response.headers).not.toHaveProperty('access-control-allow-origin');
      expect(response.headers).not.toHaveProperty('access-control-allow-credentials');
    });
  });

  describe('produção sem CORS_ORIGINS', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await buildApp(undefined, true);
    });
    afterAll(async () => {
      await app.close();
    });

    it('não libera nenhuma origem cross-origin (o app usa a mesma origem via nginx)', async () => {
      const response = await get(app, '/health', SITE).expect(200);

      expect(response.headers).not.toHaveProperty('access-control-allow-origin');
    });
  });

  describe('desenvolvimento', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await buildApp('http://localhost:3001', false);
    });
    afterAll(async () => {
      await app.close();
    });

    it('libera o frontend local (3001 configurado e 3000 padrão), sem credenciais', async () => {
      for (const origin of ['http://localhost:3001', 'http://localhost:3000']) {
        const response = await get(app, '/health', origin).expect(200);

        expect(response.headers['access-control-allow-origin']).toBe(origin);
        expect(response.headers).not.toHaveProperty('access-control-allow-credentials');
      }
    });

    it('origem desconhecida continua sem Allow-Origin', async () => {
      const response = await get(app, '/health', EVIL).expect(200);

      expect(response.headers).not.toHaveProperty('access-control-allow-origin');
    });
  });
});

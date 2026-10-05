import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import request = require('supertest');
import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';
import { MockMailService } from '../../mocks/mail.mock';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { configureTrustProxy } from '@/presentation/proxy.config';
import { UserCategory, UserRole } from '@/domain/enums/enums';

/**
 * O rate limit era por IP. Atrás do nginx todos os usuários chegam com o mesmo
 * IP, então o balde de uma rota era compartilhado pelo sistema inteiro: o
 * tráfego de um usuário (ex.: o admin) fazia o vaqueiro receber 429 e ver
 * listas vazias. Aqui o app roda como em produção — sem o header de bypass dos
 * outros e2e — e com o `trust proxy` configurado pelo mesmo código do main.ts.
 */
async function buildApp(trustProxyHops?: string) {
  process.env.TEST_THROTTLING = 'true'; // TTL de 2s e limite autenticado de 15
  const { AppModule } = await import('@/presentation/app.module');

  const moduleRef: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useClass(MockMailService)
    .compile();

  const app = moduleRef.createNestApplication();
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  configureTrustProxy(app, { get: () => trustProxyHops } as unknown as ConfigService);
  await app.init();
  app.getHttpServer().setMaxListeners(0); // rajadas simultâneas do supertest

  return { app, prisma: moduleRef.get(PrismaService) };
}

const AUTHENTICATED_LIMIT = 15;
const ANONYMOUS_LIMIT = 10;

describe('E2E: Rate limit por usuário e por IP real', () => {
  describe('com TRUST_PROXY_HOPS=1 (atrás do nginx do projeto)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let tokenA: string;
    let tokenB: string;

    const get = (path: string, ip: string, token?: string) => {
      const req = request(app.getHttpServer()).get(path).set('X-Forwarded-For', ip);
      return token ? req.set('Authorization', `Bearer ${token}`) : req;
    };

    const burst = async (total: number, send: () => Promise<{ status: number }>) => {
      const statuses = (await Promise.all(Array.from({ length: total }, send))).map((r) => r.status);
      return {
        ok: statuses.filter((s) => s === 200).length,
        limited: statuses.filter((s) => s === 429).length,
      };
    };

    const createUser = async (email: string, role: UserRole) => {
      const created = await prisma.user.create({
        data: {
          name: email,
          email,
          password: await bcrypt.hash('Senha@1234', 4),
          userCategory: UserCategory.Fisica,
          city: 'Recife',
          state: 'PE',
          role,
        },
      });
      return created.id;
    };

    const login = async (email: string, ip: string) => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email, password: 'Senha@1234' })
        .expect(200);
      return response.body.data.access_token as string;
    };

    beforeAll(async () => {
      await setupE2ETests();
      ({ app, prisma } = await buildApp('1'));
      await createUser('rl-admin@example.com', UserRole.ADMIN);
      await createUser('rl-vaqueiro@example.com', UserRole.VAQUEIRO);
      tokenA = await login('rl-admin@example.com', '10.90.0.1');
      tokenB = await login('rl-vaqueiro@example.com', '10.90.0.2');
    }, E2E_TIMEOUT);

    afterAll(async () => {
      if (app) await app.close();
      await teardownE2ETests();
    });

    it('usuário autenticado tem balde próprio: esgotar o dele não bloqueia outro usuário no mesmo IP', async () => {
      const sameIp = '10.91.0.1'; // o IP do "nginx": todo mundo chega por ele

      const adminBurst = await burst(AUTHENTICATED_LIMIT + 1, () => get('/animals', sameIp, tokenA));
      expect(adminBurst).toEqual({ ok: AUTHENTICATED_LIMIT, limited: 1 });

      // Antes: o vaqueiro dividia o balde (por IP) com o admin e recebia 429 aqui.
      const vaqueiro = await get('/animals', sameIp, tokenB);
      expect(vaqueiro.status).toBe(200);
    });

    it('o usuário que esgotou o próprio balde continua limitado, mesmo trocando de IP', async () => {
      await burst(AUTHENTICATED_LIMIT + 1, () => get('/daily-collections', '10.92.0.1', tokenA));

      const otherIp = await get('/daily-collections', '10.92.0.99', tokenA);
      expect(otherIp.status).toBe(429);
    });

    it('rota pública: limite baixo por IP real; outro IP não é afetado', async () => {
      const lookup = (ip: string) => get('/users/check-email?email=alguem@example.com', ip);

      const flood = await burst(ANONYMOUS_LIMIT + 1, () => lookup('10.93.0.1'));
      expect(flood).toEqual({ ok: ANONYMOUS_LIMIT, limited: 1 });

      expect((await lookup('10.93.0.2')).status).toBe(200);
    });

    it('valores forjados à esquerda do X-Forwarded-For não criam baldes novos', async () => {
      const lookup = (xff: string) => get('/users/check-email?email=outro@example.com', xff);

      await burst(ANONYMOUS_LIMIT + 1, () => lookup('6.6.6.6, 10.94.0.1'));

      // Mesmo cliente real (10.94.0.1, à direita), "outro" IP forjado à esquerda.
      expect((await lookup('7.7.7.7, 10.94.0.1')).status).toBe(429);
    });

    it('limites específicos de rota continuam valendo (login: 3 por janela, por IP)', async () => {
      const attempt = () =>
        request(app.getHttpServer())
          .post('/auth/login')
          .set('X-Forwarded-For', '10.95.0.1')
          .send({ email: 'inexistente@example.com', password: 'x' });

      const statuses = [];
      for (let i = 0; i < 4; i++) statuses.push((await attempt()).status);

      expect(statuses.slice(0, 3)).toEqual([401, 401, 401]);
      expect(statuses[3]).toBe(429);

      // Outro cliente real não é afetado pelo bloqueio do primeiro.
      const other = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', '10.95.0.2')
        .send({ email: 'inexistente@example.com', password: 'x' });
      expect(other.status).toBe(401);
    });
  });

  describe('sem TRUST_PROXY_HOPS (padrão seguro: ninguém é confiado)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      await setupE2ETests();
      ({ app } = await buildApp(undefined));
    }, E2E_TIMEOUT);

    afterAll(async () => {
      if (app) await app.close();
      await teardownE2ETests();
    });

    it('o X-Forwarded-For é ignorado: trocá-lo não escapa do limite por IP', async () => {
      const lookup = (xff: string) =>
        request(app.getHttpServer())
          .get('/users/check-email?email=alguem@example.com')
          .set('X-Forwarded-For', xff);

      const statuses = (
        await Promise.all(Array.from({ length: ANONYMOUS_LIMIT + 1 }, (_, i) => lookup(`10.96.0.${i}`)))
      ).map((r) => r.status);
      expect(statuses.filter((s) => s === 429)).toHaveLength(1);

      // Um "IP novo" forjado continua no mesmo balde (a conexão é a mesma).
      expect((await lookup('10.96.1.1')).status).toBe(429);
    });
  });
});

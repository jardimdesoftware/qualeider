import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';
import { MockMailService } from '../../mocks/mail.mock';
import request = require('supertest');
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';

export class TestApp {
  private app!: INestApplication;
  private moduleRef!: TestingModule;

  async setup(): Promise<INestApplication> {
    // Define que estamos em modo de teste estrito (limites baixos)
    process.env.TEST_THROTTLING = 'true';

    const { AppModule } = await import('@/presentation/app.module');

    this.moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useClass(MockMailService)
      .compile();

    this.app = this.moduleRef.createNestApplication();

    this.app.useGlobalFilters(
      new HttpExceptionFilter(),
      new PrismaExceptionFilter()
    );

    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const expressInstance = this.app.getHttpAdapter().getInstance();
    if (expressInstance && typeof expressInstance.set === 'function') {
       expressInstance.set('trust proxy', true);
    }

    await this.app.init();

    return this.app;
  }

  getApp(): INestApplication { return this.app; }
  getModule(): TestingModule { return this.moduleRef; }
  getPrismaService(): PrismaService { return this.moduleRef.get<PrismaService>(PrismaService); }
  async close(): Promise<void> { await this.app.close(); }

  request() {
    const baseRequest = request(this.app.getHttpServer());
    const header = {
      'x-e2e-bypass': 'true',
    };
    return {
      get: (url: string) => baseRequest.get(url).set(header),
      post: (url: string) => baseRequest.post(url).set(header),
      put: (url: string) => baseRequest.put(url).set(header),
      delete: (url: string) => baseRequest.delete(url).set(header),
      patch: (url: string) => baseRequest.patch(url).set(header),
      head: (url: string) => baseRequest.head(url).set(header),
    };
  }

  throttledRequest() {
    return request(this.app.getHttpServer());
  }
}
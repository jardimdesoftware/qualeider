import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';
import { MockMailService } from '../../mocks/mail.mock';
import request = require('supertest');
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';

/**
 * Classe helper para criar e gerenciar a aplicação de testes E2E
 */
export class TestApp {
  private app: INestApplication;
  private moduleRef: TestingModule;

  /**
   * Cria e inicializa a aplicação de testes
   */
  async setup(): Promise<INestApplication> {
    // Forçar modo de teste para o Throttler (TTL curto) sem alterar NODE_ENV (que quebraria DB)
    process.env.TEST_THROTTLING = 'true';

    // Importar AppModule dinamicamente APÓS definir a variável de ambiente
    // Isso garante que o throttler.config.ts seja avaliado com a nova configuração
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

    // Configura validation pipe global (igual ao main.ts)
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Habilita trust proxy para que o Throttler leia o IP do header X-Forwarded-For
    // Necessário para testes E2E de rate limiting com IPs simulados
    const expressInstance = this.app.getHttpAdapter().getInstance();
    expressInstance.set('trust proxy', true);

    await this.app.init();

    return this.app;
  }

  /**
   * Retorna a instância da aplicação
   */
  getApp(): INestApplication {
    return this.app;
  }

  /**
   * Retorna o módulo de teste
   */
  getModule(): TestingModule {
    return this.moduleRef;
  }

  /**
   * Retorna o PrismaService para operações diretas no banco
   */
  getPrismaService(): PrismaService {
    return this.moduleRef.get<PrismaService>(PrismaService);
  }

  /**
   * Executa uma requisição HTTP
   */
  request() {
    return request(this.app.getHttpServer());
  }

  /**
   * Fecha a aplicação
   */
  async close(): Promise<void> {
    await this.app.close();
  }
}

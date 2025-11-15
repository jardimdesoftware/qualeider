import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/presentation/app.module';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import * as request from 'supertest';

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
    this.moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = this.moduleRef.createNestApplication();

    // Configura validation pipe global (igual ao main.ts)
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

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

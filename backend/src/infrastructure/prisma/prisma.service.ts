import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /* istanbul ignore next */
  async onModuleInit() {
    await this.$connect();
  }

  // Sem isto cada app fechado (principalmente nos testes e2e) deixava o pool
  // aberto e a suite estourava o limite de conexoes do Postgres.
  /* istanbul ignore next */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

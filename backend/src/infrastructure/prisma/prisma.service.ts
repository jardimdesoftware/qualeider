import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  /* istanbul ignore next */
  async onModuleInit() {
    await this.$connect();
  }
}

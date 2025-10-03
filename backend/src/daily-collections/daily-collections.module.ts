import { Module } from '@nestjs/common';
import { DailyCollectionsService } from './daily-collections.service';
import { DailyCollectionsController } from './daily-collections.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DailyCollectionsController],
  providers: [DailyCollectionsService, PrismaService],
})
export class DailyCollectionsModule {}
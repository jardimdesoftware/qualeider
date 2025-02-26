import { Module } from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { AnimalsController } from './animals.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AnimalsController],
  providers: [AnimalsService, PrismaService],
})
export class AnimalsModule {}
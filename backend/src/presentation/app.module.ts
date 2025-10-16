import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { UsersPresentationModule } from './modules/users.module';
import { AnimalsPresentationModule } from './modules/animals.module';
import { DailyCollectionsPresentationModule } from './modules/daily-collections.module';
import { AuthPresentationModule } from './modules/auth.module';
import { MailModule } from '../mail/mail.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(
          process.cwd(),
          `.env.${process.env.NODE_ENV || 'development'}`,
        ),
      ],
    }),
    PrismaModule,
    InfrastructureModule,
    UsersPresentationModule,
    AnimalsPresentationModule,
    DailyCollectionsPresentationModule,
    AuthPresentationModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

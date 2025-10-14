import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AnimalsModule } from './animals/animals.module';
import { DailyCollectionsModule } from './daily-collections/daily-collections.module';
import { MailService } from './mail/mail.service';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    AnimalsModule,
    DailyCollectionsModule,
    AuthModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService, AuthService, JwtService],
})
export class AppModule {}

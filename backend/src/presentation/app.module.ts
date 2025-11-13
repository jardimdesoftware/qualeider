import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { UsersPresentationModule } from './modules/users.module';
import { AnimalsPresentationModule } from './modules/animals.module';
import { DailyCollectionsPresentationModule } from './modules/daily-collections.module';
import { AuthPresentationModule } from './modules/auth.module';
import { AssociationsPresentationModule } from './modules/associations.module';
import { InvitesPresentationModule } from './modules/invites.module';
import { NotificationsPresentationModule } from './modules/notifications.module';
import { MailModule } from '@/mail/mail.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
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
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    InfrastructureModule,
    UsersPresentationModule,
    AnimalsPresentationModule,
    DailyCollectionsPresentationModule,
    AuthPresentationModule,
    AssociationsPresentationModule,
    InvitesPresentationModule,
    NotificationsPresentationModule,
    MailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

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
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@/common/logger/logger.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { throttlerConfig } from '@/common/throttler/throttler.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { cacheConfig } from '@/common/cache/cache.config';
import * as path from 'path';
import { APP_GUARD } from '@nestjs/core';
import { AppThrottlerGuard } from '@/guards/app-throttler-guards';

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
    WinstonModule.forRoot(winstonConfig),
    ThrottlerModule.forRoot(throttlerConfig),
    CacheModule.register(cacheConfig),
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}

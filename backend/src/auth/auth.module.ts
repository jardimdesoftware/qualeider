import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersApplicationModule } from '@/application/services/users/users.module';
import { AssociationsApplicationModule } from '@/application/services/associations/associations.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { MailModule } from '@/mail/mail.module';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

@Module({
  imports: [
    UsersApplicationModule,
    AssociationsApplicationModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    MailModule,
    InfrastructureModule,
  ],
  providers: [AuthService, JwtStrategy, PrismaService, ConfigService],
  exports: [AuthService],
})
export class AuthModule {}

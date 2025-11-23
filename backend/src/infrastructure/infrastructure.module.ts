import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { PrismaUserRepository } from '@/infrastructure/repositories/prisma-user.repository';
import { PrismaAnimalRepository } from '@/infrastructure/repositories/prisma-animal.repository';
import { PrismaDailyCollectionRepository } from '@/infrastructure/repositories/prisma-daily-collection.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IAnimalRepository } from '@/domain/repositories/animal.repository';
import { IDailyCollectionRepository } from '@/domain/repositories/daily-collection.repository';
import { BcryptHashService } from '@/infrastructure/services/bcrypt-hash.service';
import { PrismaFailedEmailRepository } from '@/infrastructure/repositories/prisma-failed-email.repository';
import { IFailedEmailRepository } from '@/domain/repositories/failed-email.repository';
import { IHashService } from '@/application/ports/hash.service';
import { ITokenService } from '@/application/ports/token.service';
import { JwtTokenService } from '@/infrastructure/services/jwt-token.service';
import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { PrismaAssociationRepository } from '@/infrastructure/repositories/prisma-association.repository';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    { provide: IUserRepository, useClass: PrismaUserRepository },
    { provide: IAnimalRepository, useClass: PrismaAnimalRepository },
    {
      provide: IDailyCollectionRepository,
      useClass: PrismaDailyCollectionRepository,
    },
    { provide: IHashService, useClass: BcryptHashService },
    { provide: ITokenService, useClass: JwtTokenService },
    { provide: IFailedEmailRepository, useClass: PrismaFailedEmailRepository },
    { provide: IAssociationRepository, useClass: PrismaAssociationRepository },
  ],
  exports: [
    PrismaModule,
    IUserRepository,
    IAnimalRepository,
    IDailyCollectionRepository,
    IHashService,
    ITokenService,
    IFailedEmailRepository,
    IAssociationRepository,
  ],
})
export class InfrastructureModule {}

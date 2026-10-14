import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { UsersService } from './users.service';
import { DefaultAccountsService } from './default-accounts.service';
import { AccountPurgeService } from './account-purge.service';

@Module({
  imports: [InfrastructureModule],
  providers: [UsersService, DefaultAccountsService, AccountPurgeService],
  exports: [UsersService],
})
export class UsersApplicationModule {}

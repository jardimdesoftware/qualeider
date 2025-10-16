import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { UsersService } from './users.service';

@Module({
  imports: [InfrastructureModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersApplicationModule {}

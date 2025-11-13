import { Module } from '@nestjs/common';
import { UsersApplicationModule } from '@/application/services/users/users.module';
import { UsersController } from '@/presentation/controllers/users.controller';

@Module({
  imports: [UsersApplicationModule],
  controllers: [UsersController],
})
export class UsersPresentationModule {}

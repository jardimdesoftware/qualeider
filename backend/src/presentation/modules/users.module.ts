import { Module } from '@nestjs/common';
import { UsersApplicationModule } from '@/application/services/users/users.module';
import { UsersController } from '@/presentation/controllers/users.controller';
import { IsEmailUniqueConstraint } from '@/common/decorators/is-email-unique.decorator';

@Module({
  imports: [UsersApplicationModule],
  controllers: [UsersController],
  providers: [
    IsEmailUniqueConstraint
  ],
})
export class UsersPresentationModule {}

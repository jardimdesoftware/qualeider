import { Module } from '@nestjs/common';
import { UsersModule as FeatureUsersModule } from '../../users/users.module';
import { UsersController } from '../controllers/users.controller';

@Module({
  imports: [FeatureUsersModule],
  controllers: [UsersController],
})
export class UsersPresentationModule {}

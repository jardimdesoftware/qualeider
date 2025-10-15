import { Module } from '@nestjs/common';
import { AuthModule as FeatureAuthModule } from '../../auth/auth.module';
import { AuthController } from '../controllers/auth.controller';

@Module({
  imports: [FeatureAuthModule],
  controllers: [AuthController],
})
export class AuthPresentationModule {}

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /* istanbul ignore next */
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

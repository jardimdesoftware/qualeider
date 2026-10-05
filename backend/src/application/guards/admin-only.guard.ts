import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@/domain/enums/enums';

/**
 * Restringe a rota a usuários ADMIN. Roda depois do JwtAuthGuard global (que já
 * popula `request.user`), então rotas @Public() não devem usá-lo. Associações
 * (userType "association") não têm `role` e também ficam de fora.
 */
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;

    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem executar esta ação.',
      );
    }
    return true;
  }
}

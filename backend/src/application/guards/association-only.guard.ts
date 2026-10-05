import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Restringe a rota a quem fez login COMO associação (userType "association").
 * Essas rotas usam o `id` do token como id da associação; para um usuário comum
 * esse `id` é de outra tabela, e o número poderia coincidir com o de uma
 * associação qualquer, expondo dados de terceiros.
 */
@Injectable()
export class AssociationOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;

    if (user?.userType !== 'association') {
      throw new ForbiddenException(
        'Esta ação é exclusiva de contas de associação.',
      );
    }
    return true;
  }
}

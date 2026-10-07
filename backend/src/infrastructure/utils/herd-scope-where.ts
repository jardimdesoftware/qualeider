import { Prisma } from '@prisma/client';
import { HerdScope } from '@/domain/utils/herd-scope.util';

/**
 * Filtro de usuários dentro do escopo (associação > grupo Admin + funcionários >
 * o próprio usuário). Aplicado com AND em cima dos demais filtros, para que um
 * parâmetro da requisição (userId, associationId...) nunca amplie o escopo.
 */
export function herdScopeUserWhere(scope: HerdScope): Prisma.UserWhereInput {
  if (scope.associationId) return { associationId: scope.associationId };
  if (scope.adminGroupId) {
    return { OR: [{ id: scope.adminGroupId }, { adminId: scope.adminGroupId }] };
  }
  return { id: scope.userId };
}

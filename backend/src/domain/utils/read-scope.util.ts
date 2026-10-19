import { UserRole } from '@/domain/enums/enums';
import { HerdScope, isSameHerd, resolveHerdScope } from '@/domain/utils/herd-scope.util';

/** Quem está lendo: o `request.user` do JWT (ADMIN ou VAQUEIRO). */
export interface ReadPrincipal {
  id: number;
  role?: UserRole | null;
  adminId?: number | null;
}

interface OwnerLike {
  id: number;
  role: UserRole;
  adminId?: number | null;
}

/**
 * Escopo de leitura obrigatório. Ninguém lê dados de outro dono: o usuário lê o
 * próprio rebanho (grupo Admin + funcionários > ele mesmo), a mesma regra de
 * resolveHerdScope.
 */
export function resolveReadScope(principal: ReadPrincipal): HerdScope {
  return resolveHerdScope({
    id: principal.id,
    role: principal.role as UserRole,
    adminId: principal.adminId,
  });
}

/** O dono (usuário) de um registro está dentro do escopo de quem lê? */
export function canReadOwner(principal: ReadPrincipal, owner: OwnerLike): boolean {
  return isSameHerd(
    {
      id: principal.id,
      role: principal.role as UserRole,
      adminId: principal.adminId,
    },
    owner,
  );
}

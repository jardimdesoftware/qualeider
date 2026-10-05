import { UserRole } from '@/domain/enums/enums';
import { HerdScope, isSameHerd, resolveHerdScope } from '@/domain/utils/herd-scope.util';

/**
 * Quem está lendo: o `request.user` do JWT. Para um login de associação
 * (`userType === 'association'`) o `id` é o da PRÓPRIA associação e não há
 * role/adminId; para usuários (ADMIN/VAQUEIRO) valem as regras de rebanho.
 */
export interface ReadPrincipal {
  id: number;
  userType?: string;
  role?: UserRole | null;
  associationId?: number | null;
  adminId?: number | null;
}

interface OwnerLike {
  id: number;
  role: UserRole;
  associationId?: number | null;
  adminId?: number | null;
}

export function isAssociationPrincipal(principal: ReadPrincipal): boolean {
  return principal.userType === 'association';
}

/**
 * Escopo de leitura obrigatório. Ninguém lê dados de outro dono: associação ->
 * os seus membros; usuário -> o próprio rebanho (associação > grupo Admin +
 * funcionários > ele mesmo), a mesma regra de resolveHerdScope.
 */
export function resolveReadScope(principal: ReadPrincipal): HerdScope {
  if (isAssociationPrincipal(principal)) {
    return { associationId: principal.id };
  }
  return resolveHerdScope({
    id: principal.id,
    role: principal.role as UserRole,
    associationId: principal.associationId,
    adminId: principal.adminId,
  });
}

/** O dono (usuário) de um registro está dentro do escopo de quem lê? */
export function canReadOwner(principal: ReadPrincipal, owner: OwnerLike): boolean {
  if (isAssociationPrincipal(principal)) {
    return owner.associationId != null && owner.associationId === principal.id;
  }
  return isSameHerd(
    {
      id: principal.id,
      role: principal.role as UserRole,
      associationId: principal.associationId,
      adminId: principal.adminId,
    },
    owner,
  );
}

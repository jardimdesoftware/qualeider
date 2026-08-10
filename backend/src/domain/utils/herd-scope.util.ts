import { UserRole } from '@/domain/enums/enums';

/**
 * Escopo de rebanho compartilhado: define o grupo de usuarios cujos animais
 * devem ser tratados como o "mesmo rebanho" (visibilidade e unicidade de
 * identificador). Usado tanto por AnimalsController.findAllByUserId quanto
 * por AnimalsService ao validar duplicidade de tagNumber.
 *
 * Prioridade: associacao formal (cooperativa) > grupo Admin+Vaqueiros > usuario isolado.
 */
export interface HerdScope {
  associationId?: number;
  adminGroupId?: number;
  userId?: number;
}

interface HerdMember {
  id: number;
  role: UserRole;
  associationId?: number | null;
  adminId?: number | null;
}

export function resolveHerdScope(user: HerdMember): HerdScope {
  if (user.associationId) {
    return { associationId: user.associationId };
  }
  if (user.role === UserRole.ADMIN) {
    return { adminGroupId: user.id };
  }
  if (user.adminId) {
    return { adminGroupId: user.adminId };
  }
  return { userId: user.id };
}

/**
 * Verifica se dois usuarios pertencem ao mesmo rebanho (mesma associacao
 * formal, ou mesmo grupo Admin+Vaqueiros). Usado para validar que um animal
 * pertence ao "escopo" de quem esta registrando uma coleta para ele, mesmo
 * quando o cadastro original foi feito por outro membro do mesmo grupo.
 */
export function isSameHerd(a: HerdMember, b: HerdMember): boolean {
  if (a.id === b.id) return true;
  if (a.associationId != null && a.associationId === b.associationId) return true;

  const rootA = a.role === UserRole.ADMIN ? a.id : a.adminId;
  const rootB = b.role === UserRole.ADMIN ? b.id : b.adminId;

  return rootA != null && rootB != null && rootA === rootB;
}

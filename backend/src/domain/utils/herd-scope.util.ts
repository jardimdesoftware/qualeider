import { UserRole } from '@/domain/enums/enums';

/**
 * Escopo de rebanho compartilhado: define o grupo de usuarios cujos animais
 * devem ser tratados como o "mesmo rebanho" (visibilidade e unicidade de
 * identificador). Usado tanto por AnimalsController.findAllByUserId quanto
 * por AnimalsService ao validar duplicidade de tagNumber.
 *
 * Existe um unico grupo no sistema: o do admin fixo. Toda conta criada por um admin
 * (admin ou vaqueiro) e toda conta criada pelo login do Google fica ligada a esse
 * admin raiz via `adminId`, entao todos enxergam o mesmo rebanho. Um usuario sem
 * grupo (dados antigos) enxerga so o que e dele.
 */
export interface HerdScope {
  adminGroupId?: number;
  userId?: number;
}

interface HerdMember {
  id: number;
  role: UserRole;
  adminId?: number | null;
}

/** Raiz do grupo: o admin que cadastrou a conta, ou o proprio admin se ele for a raiz. */
export function herdRootId(user: HerdMember): number | null {
  if (user.adminId != null) return user.adminId;
  return user.role === UserRole.ADMIN ? user.id : null;
}

export function resolveHerdScope(user: HerdMember): HerdScope {
  const root = herdRootId(user);
  return root != null ? { adminGroupId: root } : { userId: user.id };
}

/**
 * Verifica se dois usuarios pertencem ao mesmo rebanho (mesmo grupo). Usado para
 * validar que um animal pertence ao "escopo" de quem esta registrando uma coleta
 * para ele, mesmo quando o cadastro original foi feito por outro membro do grupo.
 */
export function isSameHerd(a: HerdMember, b: HerdMember): boolean {
  if (a.id === b.id) return true;

  const rootA = herdRootId(a);
  const rootB = herdRootId(b);

  return rootA != null && rootB != null && rootA === rootB;
}

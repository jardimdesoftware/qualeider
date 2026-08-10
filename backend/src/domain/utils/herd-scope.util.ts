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

export function resolveHerdScope(user: {
  id: number;
  role: UserRole;
  associationId?: number | null;
  adminId?: number | null;
}): HerdScope {
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

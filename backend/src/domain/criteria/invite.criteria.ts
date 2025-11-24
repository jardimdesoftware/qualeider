import { InviteStatus } from '@/domain/enums/enums';

/**
 * Critérios de filtragem para busca de convites.
 * @property associationId - Filtrar por ID da associação
 * @property status - Filtrar por status (padrão: 'Active' se não informado)
 * @property token - Filtrar por token
 * @property expiresAfter - Filtrar por data de expiração
 */
export interface InviteCriteria {
  userId?: number;
  associationId?: number;
  status?: InviteStatus;
  token?: string;
  expiresAfter?: Date; 
}

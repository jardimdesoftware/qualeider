/**
 * Status possíveis de um convite
 */
export enum InviteStatus {
  /** Aguardando resposta do usuário */
  PENDING = 'PENDING',

  /** Usuário aceitou o convite */
  ACCEPTED = 'ACCEPTED',

  /** Usuário recusou o convite */
  DECLINED = 'DECLINED',

  /** Convite expirou sem resposta */
  EXPIRED = 'EXPIRED',

  /** Associação cancelou o convite */
  CANCELED = 'CANCELED',
}

/**
 * Evento emitido quando um convite é criado
 * Usado para acionar envio de email e notificações in-app
 */
export class InviteCreatedEvent {
  constructor(
    /** ID do convite criado */
    public readonly inviteId: number,

    /** ID do usuário convidado */
    public readonly userId: number,

    /** Nome do usuário convidado */
    public readonly userName: string,

    /** Email do usuário convidado */
    public readonly userEmail: string,

    /** ID da associação que enviou o convite */
    public readonly associationId: number,

    /** Nome da associação */
    public readonly associationName: string,

    /** Mensagem personalizada (pode ser null) */
    public readonly message: string | null,

    /** Token único para aceitar/recusar via link */
    public readonly token: string,

    /** Data de expiração do convite */
    public readonly expiresAt: Date,
  ) {}
}

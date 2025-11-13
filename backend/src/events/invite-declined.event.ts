/**
 * Evento emitido quando um convite é recusado
 * Usado para notificar a associação e criar logs
 */
export class InviteDeclinedEvent {
  constructor(
    /** ID do convite recusado */
    public readonly inviteId: number,

    /** ID do usuário que recusou */
    public readonly userId: number,

    /** Nome do usuário */
    public readonly userName: string,

    /** ID da associação */
    public readonly associationId: number,

    /** Nome da associação */
    public readonly associationName: string,
  ) {}
}

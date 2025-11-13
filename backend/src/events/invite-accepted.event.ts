/**
 * Evento emitido quando um convite é aceito
 * Usado para notificar a associação e criar logs
 */
export class InviteAcceptedEvent {
  constructor(
    /** ID do convite aceito */
    public readonly inviteId: number,

    /** ID do usuário que aceitou */
    public readonly userId: number,

    /** Nome do usuário */
    public readonly userName: string,

    /** ID da associação */
    public readonly associationId: number,

    /** Nome da associação */
    public readonly associationName: string,
  ) {}
}

/**
 * Evento emitido quando um convite é recusado
 * Usado para notificar a associação e criar logs
 */
export class InviteDeclinedEvent {
  public readonly inviteId: number;
  public readonly userId: number;
  public readonly userName: string;
  public readonly associationId: number;
  public readonly associationName: string;

  constructor(props: Partial<InviteDeclinedEvent>) {
    Object.assign(this, props);
  }
}

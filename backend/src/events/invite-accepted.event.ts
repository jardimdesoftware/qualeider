/**
 * Evento emitido quando um convite é aceito
 * Usado para notificar a associação e criar logs
 */
export class InviteAcceptedEvent {
  public readonly inviteId!: number;
  public readonly userId!: number;
  public readonly userName!: string;
  public readonly associationId!: number;
  public readonly associationName!: string;

  constructor(props: Partial<InviteAcceptedEvent>) {
    Object.assign(this, props);
  }
}

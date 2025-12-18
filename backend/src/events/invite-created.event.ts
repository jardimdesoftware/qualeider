/**
 * Evento emitido quando um convite é criado
 * Usado para acionar envio de email e notificações in-app
 */
export class InviteCreatedEvent {
  public readonly inviteId!: number;
  public readonly userId!: number;
  public readonly userName!: string;
  public readonly userEmail!: string;
  public readonly associationId!: number;
  public readonly associationName!: string;
  public readonly message!: string | null;
  public readonly token!: string;
  public readonly expiresAt!: Date;

  constructor(props: Partial<InviteCreatedEvent>) {
    Object.assign(this, props);
  }
}

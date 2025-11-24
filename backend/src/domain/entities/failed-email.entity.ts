export interface EmailPayload {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export class FailedEmail {
  id: string;
  payload: EmailPayload;
  errorReason: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props?: Partial<FailedEmail>) {
    if (props) Object.assign(this, props);
  }
}

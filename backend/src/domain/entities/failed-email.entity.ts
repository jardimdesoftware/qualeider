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

  constructor(
    id: string,
    payload: EmailPayload,
    errorReason: string,
    retryCount: number,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.payload = payload;
    this.errorReason = errorReason;
    this.retryCount = retryCount;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

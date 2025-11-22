import { FailedEmail, EmailPayload } from '@/domain/entities/failed-email.entity';

export abstract class IFailedEmailRepository {
  abstract create(data: {
    payload: EmailPayload;
    errorReason: string;
    retryCount: number;
  }): Promise<FailedEmail>;
}

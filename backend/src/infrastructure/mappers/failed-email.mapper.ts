import { FailedEmail, EmailPayload } from '@/domain/entities/failed-email.entity';
import { FailedEmail as PrismaFailedEmail, Prisma } from '@prisma/client';

export class FailedEmailMapper {
  static toDomain(raw: PrismaFailedEmail): FailedEmail {
    return new FailedEmail({
      id: raw.id,
      payload: raw.payload as unknown as EmailPayload,
      errorReason: raw.errorReason,
      retryCount: raw.retryCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(failedEmail: FailedEmail) {
    return {
      id: failedEmail.id,
      payload: failedEmail.payload as unknown as Prisma.JsonValue,
      errorReason: failedEmail.errorReason,
      retryCount: failedEmail.retryCount,
      createdAt: failedEmail.createdAt,
      updatedAt: failedEmail.updatedAt,
    };
  }
}

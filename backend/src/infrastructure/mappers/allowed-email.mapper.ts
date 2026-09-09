import { AllowedEmail as PrismaAllowedEmail } from '@prisma/client';
import { AllowedEmailEntity } from '@/domain/entities/allowed-email.entity';

export class AllowedEmailMapper {
  static toDomain(raw: PrismaAllowedEmail): AllowedEmailEntity {
    return new AllowedEmailEntity({
      id: raw.id,
      email: raw.email,
      createdAt: raw.createdAt,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { IFailedEmailRepository } from '@/domain/repositories/failed-email.repository';
import { FailedEmail, EmailPayload } from '@/domain/entities/failed-email.entity';

@Injectable()
export class PrismaFailedEmailRepository implements IFailedEmailRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    payload: EmailPayload;
    errorReason: string;
    retryCount: number;
  }): Promise<FailedEmail> {
    const created = await this.prisma.failedEmail.create({
      data: {
        payload: data.payload as any,
        errorReason: data.errorReason,
        retryCount: data.retryCount,
      },
    });
    return new FailedEmail(
      created.id,
      created.payload as unknown as EmailPayload,
      created.errorReason,
      created.retryCount,
      created.createdAt,
      created.updatedAt,
    );
  }
}

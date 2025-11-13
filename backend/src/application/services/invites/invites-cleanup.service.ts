import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { InviteStatus } from '@/application/enums/invite-status.enum';

@Injectable()
export class InvitesCleanupService {
  private readonly logger = new Logger(InvitesCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Roda todos os dias à meia-noite
   * Marca convites pendentes expirados como EXPIRED
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldInvites() {
    this.logger.log('Iniciando verificação de convites expirados...');

    const result = await this.prisma.invite.updateMany({
      where: {
        status: InviteStatus.PENDING,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: InviteStatus.EXPIRED,
      },
    });

    this.logger.log(
      `✅ ${result.count} convite(s) marcado(s) como expirado(s)`,
    );

    return {
      success: true,
      expiredCount: result.count,
      timestamp: new Date(),
    };
  }

  async manualExpireCheck() {
    this.logger.log('Execução manual de verificação de convites expirados');
    return this.expireOldInvites();
  }
}

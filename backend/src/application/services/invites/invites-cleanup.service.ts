import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IInviteRepository } from '@/domain/repositories/invite.repository';

@Injectable()
export class InvitesCleanupService {
  private readonly logger = new Logger(InvitesCleanupService.name);

  constructor(
    @Inject(IInviteRepository)
    private readonly inviteRepository: IInviteRepository,
  ) {}

  /**
   * Roda todos os dias à meia-noite
   * Marca convites pendentes expirados como EXPIRED
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldInvites() {
    this.logger.log('Iniciando verificação de convites expirados...');

    const expiredCount = await this.inviteRepository.expireOldInvites();

    this.logger.log(
      `${expiredCount} convite(s) marcado(s) como expirado(s)`,
    );

    return {
      success: true,
      expiredCount,
      timestamp: new Date(),
    };
  }

  async manualExpireCheck() {
    this.logger.log('Execução manual de verificação de convites expirados');
    return this.expireOldInvites();
  }
}


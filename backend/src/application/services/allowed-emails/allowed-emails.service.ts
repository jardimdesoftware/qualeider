import { Injectable, Inject, Logger } from '@nestjs/common';
import { IAllowedEmailRepository } from '@/domain/repositories/allowed-email.repository';
import { CreateAllowedEmailDto } from '@/application/dtos/allowed-emails/create-allowed-email.dto';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { ID } from '@/domain/enums/enums';
import { isIfpeEmail } from '@/common/utils/email-domain.util';

@Injectable()
export class AllowedEmailsService {
  private readonly logger = new Logger(AllowedEmailsService.name);

  constructor(
    @Inject(IAllowedEmailRepository)
    private readonly allowedEmailRepository: IAllowedEmailRepository,
  ) {}

  /** As liberações são compartilhadas: todo admin vê todas. */
  async findAll() {
    return this.allowedEmailRepository.findAll();
  }

  /**
   * Registra o admin que liberou o email (só para histórico): no primeiro login via
   * Google o funcionário entra no grupo do admin raiz (ver AuthService.loginWithGoogle).
   */
  async create(dto: CreateAllowedEmailDto, adminId: ID) {
    if (isIfpeEmail(dto.email)) {
      throw new BusinessException(
        'Emails @ifpe.edu.br já têm acesso automático — não é preciso liberar.',
      );
    }

    const existing = await this.allowedEmailRepository.findByEmail(dto.email);
    if (existing) {
      throw new BusinessException('Este email já está liberado.');
    }

    const allowedEmail = await this.allowedEmailRepository.create(dto.email, adminId);
    this.logger.log(`Email liberado para login via Google: ${allowedEmail.email}`);
    return allowedEmail;
  }

  /** Qualquer admin pode remover uma liberação. */
  async remove(id: ID) {
    const allowedEmail = await this.allowedEmailRepository.findById(id);
    if (!allowedEmail) {
      throw new EntityNotFoundException(`Email liberado com ID ${id} não encontrado.`);
    }

    await this.allowedEmailRepository.delete(id);
    this.logger.log(`Acesso via Google removido: email liberado ID ${id}`);
  }
}

import { ForbiddenException, Injectable, Inject, Logger } from '@nestjs/common';
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

  /** Cada admin vê as próprias liberações e as antigas sem dono. */
  async findAll(adminId: ID) {
    return this.allowedEmailRepository.findAll(adminId);
  }

  /**
   * Registra o admin que liberou o email: é a ele que o funcionário será
   * vinculado no primeiro login via Google (ver AuthService.loginWithGoogle).
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

  /** Só o admin dono (ou qualquer admin, se a liberação for antiga e sem dono) pode remover. */
  async remove(id: ID, adminId: ID) {
    const allowedEmail = await this.allowedEmailRepository.findById(id);
    if (!allowedEmail) {
      throw new EntityNotFoundException(`Email liberado com ID ${id} não encontrado.`);
    }

    if (allowedEmail.adminId != null && allowedEmail.adminId !== adminId) {
      throw new ForbiddenException('Esta liberação pertence a outro administrador.');
    }

    await this.allowedEmailRepository.delete(id);
    this.logger.log(`Acesso via Google removido: email liberado ID ${id}`);
  }
}

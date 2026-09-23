import { Injectable, Inject, Logger } from '@nestjs/common';
import { IAllowedEmailRepository } from '@/domain/repositories/allowed-email.repository';
import { CreateAllowedEmailDto } from '@/application/dtos/allowed-emails/create-allowed-email.dto';
import { BusinessException } from '@/common/exceptions/business.exception';
import { ID } from '@/domain/enums/enums';
import { isIfpeEmail } from '@/common/utils/email-domain.util';

@Injectable()
export class AllowedEmailsService {
  private readonly logger = new Logger(AllowedEmailsService.name);

  constructor(
    @Inject(IAllowedEmailRepository)
    private readonly allowedEmailRepository: IAllowedEmailRepository,
  ) {}

  async findAll() {
    return this.allowedEmailRepository.findAll();
  }

  async create(dto: CreateAllowedEmailDto) {
    if (isIfpeEmail(dto.email)) {
      throw new BusinessException(
        'Emails @ifpe.edu.br já têm acesso automático — não é preciso liberar.',
      );
    }

    const existing = await this.allowedEmailRepository.findByEmail(dto.email);
    if (existing) {
      throw new BusinessException('Este email já está liberado.');
    }

    const allowedEmail = await this.allowedEmailRepository.create(dto.email);
    this.logger.log(`Email liberado para login via Google: ${allowedEmail.email}`);
    return allowedEmail;
  }

  async remove(id: ID) {
    // Repository lança EntityNotFoundException se o ID não existir (P2025)
    await this.allowedEmailRepository.delete(id);
    this.logger.log(`Acesso via Google removido: email liberado ID ${id}`);
  }
}

import { Injectable, Logger, Inject } from '@nestjs/common';
import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { CreateAssociationDto } from '@/application/dtos/associations/create-association.dto';
import { IHashService } from '@/application/ports/hash.service';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { BusinessException } from '@/common/exceptions/business.exception';

@Injectable()
export class AssociationsService {
  private readonly logger = new Logger(AssociationsService.name);

  constructor(
    @Inject(IAssociationRepository)
    private readonly associationRepository: IAssociationRepository,
    @Inject(IHashService) private readonly hashService: IHashService,
  ) {}

  private removePassword<T>(entity: T): Omit<T, 'password'> {
    if (entity && typeof entity === 'object' && 'password' in entity) {
      const { password, ...rest } = entity as any;
      return rest;
    }
    return entity as Omit<T, 'password'>;
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return this.associationRepository.findByEmail(email.toLowerCase());
  }

  async findByCnpj(cnpj: string) {
    if (!cnpj) return null;
    return this.associationRepository.findByCnpj(cnpj);
  }

  async create(createAssociationDto: CreateAssociationDto) {
    // Validate email uniqueness
    const existingEmail = await this.findByEmail(createAssociationDto.email);
    if (existingEmail) {
      throw new BusinessException('Email já cadastrado.');
    }

    // Validate CNPJ uniqueness
    const existingCnpj = await this.findByCnpj(createAssociationDto.cnpj);
    if (existingCnpj) {
      throw new BusinessException('CNPJ já cadastrado.');
    }

    const { password, ...rest } = createAssociationDto;

    const hashedPassword = await this.hashService.hash(
      password,
      BCRYPT_ROUNDS_USER_CREATION,
    );

    const association = await this.associationRepository.create({
      ...rest,
      password: hashedPassword,
      foundationDate: rest.foundationDate ? new Date(rest.foundationDate) : null,
    } as any);

    this.logger.log(
      `Associação criada: ${association.name} (ID: ${association.id})`,
    );

    return this.removePassword(association);
  }
}

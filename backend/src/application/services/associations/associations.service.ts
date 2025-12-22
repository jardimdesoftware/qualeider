import { Injectable, Logger, Inject } from '@nestjs/common';
import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { AssociationEntity } from '@/domain/entities/association.entity';
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
      const { password, ...rest } = entity as T & { password?: unknown };
      return rest as Omit<T, 'password'>;
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

  async findById(id: number) {
    const association = await this.associationRepository.findById(id);
    if (!association) return null;
    return this.removePassword(association);
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

    const { phone, password, ...rest } = createAssociationDto;
    
    const entityData = {
      ...rest,
      landlinePhone: rest.landlinePhone || phone,
      presidentEmail: rest.presidentEmail || createAssociationDto.email,
      presidentPhone: rest.presidentPhone || phone,
      foundationDate: rest.foundationDate ? new Date(rest.foundationDate) : null,
    };

    const hashedPassword = await this.hashService.hash(
      password,
      BCRYPT_ROUNDS_USER_CREATION,
    );

    const association = await this.associationRepository.create({
      ...entityData,
      password: hashedPassword,
    } as Omit<AssociationEntity, 'id' | 'createdAt' | 'updatedAt'>);

    this.logger.log(
      `Associação criada: ${association.name} (ID: ${association.id})`,
    );

    return this.removePassword(association);
  }

  async findAssociates(associationId: number, options: { page: number; limit: number }) {
     return this.associationRepository.findAssociates(associationId, options);
  }

  async getHerdStats(associationId: number) {
      return this.associationRepository.getHerdStats(associationId);
  }

  async getAvailableProducers() {
      return this.associationRepository.findAvailableProducers();
  }

  async linkProducer(userId: number, associationId: number) {
      return this.associationRepository.linkProducer(userId, associationId);
  }

  async update(id: number, data: Partial<CreateAssociationDto>) {
      const { password, ...updateData } = data;
      
      // If password update is needed, hash it.
      if (password) {
         (updateData as Record<string, unknown>).password = await this.hashService.hash(
          password,
          BCRYPT_ROUNDS_USER_CREATION,
        );
      }

      const updated = await this.associationRepository.update(id, updateData as Partial<AssociationEntity>);
      return this.removePassword(updated);
  }

  async getProducerRanking(associationId: number, startDate?: Date, endDate?: Date) {
    return this.associationRepository.getProducerRanking(associationId, startDate, endDate);
  }

  async getMonthlyReport(associationId: number, year: number, month: number) {
    return this.associationRepository.getMonthlyReport(associationId, year, month);
  }
}

import { Injectable, Inject, Logger } from '@nestjs/common';
import { IDestinationRepository } from '@/domain/repositories/destination.repository';
import { CreateDestinationDto } from '@/application/dtos/destinations/create-destination.dto';
import { UpdateDestinationDto } from '@/application/dtos/destinations/update-destination.dto';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BusinessException } from '@/common/exceptions/business.exception';

@Injectable()
export class DestinationsService {
  private readonly logger = new Logger(DestinationsService.name);

  constructor(
    @Inject(IDestinationRepository) private destinationRepository: IDestinationRepository,
  ) {}

  async create(createDestinationDto: CreateDestinationDto) {
    const existing = await this.destinationRepository.findByName(createDestinationDto.name);
    if (existing) {
      throw new BusinessException(`Destino com nome "${createDestinationDto.name}" já existe.`);
    }

    const destination = await this.destinationRepository.create(createDestinationDto);
    this.logger.log(`Destino criado: ${destination.name} (ID: ${destination.id})`);
    return destination;
  }

  async findAll() {
    return this.destinationRepository.findAll();
  }

  async findOne(id: number) {
    const destination = await this.destinationRepository.findById(id);
    if (!destination) {
      throw new EntityNotFoundException(`Destino com ID ${id} não encontrado.`);
    }
    return destination;
  }

  async update(id: number, updateDestinationDto: UpdateDestinationDto) {
    await this.findOne(id);

    if (updateDestinationDto.name) {
      const existing = await this.destinationRepository.findByName(updateDestinationDto.name);
      if (existing && existing.id !== id) {
        throw new BusinessException(`Destino com nome "${updateDestinationDto.name}" já existe.`);
      }
    }

    return this.destinationRepository.update(id, updateDestinationDto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.destinationRepository.delete(id);
  }
}

import { Injectable, Inject, Logger } from '@nestjs/common';
import { IAnimalSpeciesRepository } from '@/domain/repositories/animal-species.repository';
import { CreateAnimalSpeciesDto } from '@/application/dtos/animal-species/create-animal-species.dto';
import { UpdateAnimalSpeciesDto } from '@/application/dtos/animal-species/update-animal-species.dto';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BusinessException } from '@/common/exceptions/business.exception';

@Injectable()
export class AnimalSpeciesService {
  private readonly logger = new Logger(AnimalSpeciesService.name);

  constructor(
    @Inject(IAnimalSpeciesRepository) private repo: IAnimalSpeciesRepository,
  ) {}

  async create(dto: CreateAnimalSpeciesDto) {
    const existing = await this.repo.findByName(dto.name);
    if (existing) throw new BusinessException(`Tipo "${dto.name}" já existe.`);
    const species = await this.repo.create(dto);
    this.logger.log(`Tipo criado: ${species.name} (ID: ${species.id})`);
    return species;
  }

  async findAll() {
    return this.repo.findAll();
  }

  async findOne(id: number) {
    const species = await this.repo.findById(id);
    if (!species) throw new EntityNotFoundException(`Tipo com ID ${id} não encontrado.`);
    return species;
  }

  async update(id: number, dto: UpdateAnimalSpeciesDto) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.repo.findByName(dto.name);
      if (existing && existing.id !== id) throw new BusinessException(`Tipo "${dto.name}" já existe.`);
    }
    return this.repo.update(id, dto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}

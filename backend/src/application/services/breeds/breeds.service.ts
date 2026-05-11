import { Injectable, Inject, Logger } from '@nestjs/common';
import { IBreedRepository } from '@/domain/repositories/breed.repository';
import { CreateBreedDto } from '@/application/dtos/breeds/create-breed.dto';
import { UpdateBreedDto } from '@/application/dtos/breeds/update-breed.dto';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BusinessException } from '@/common/exceptions/business.exception';

@Injectable()
export class BreedsService {
  private readonly logger = new Logger(BreedsService.name);

  constructor(
    @Inject(IBreedRepository) private breedRepository: IBreedRepository,
  ) {}

  async create(createBreedDto: CreateBreedDto) {
    const existing = await this.breedRepository.findByName(createBreedDto.name);
    if (existing) {
      throw new BusinessException(`Raça com nome "${createBreedDto.name}" já existe.`);
    }

    const breed = await this.breedRepository.create(createBreedDto);
    this.logger.log(`Raça criada: ${breed.name} (ID: ${breed.id})`);
    return breed;
  }

  async findAll() {
    return this.breedRepository.findAll();
  }

  async findOne(id: number) {
    const breed = await this.breedRepository.findById(id);
    if (!breed) {
      throw new EntityNotFoundException(`Raça com ID ${id} não encontrada.`);
    }
    return breed;
  }

  async update(id: number, updateBreedDto: UpdateBreedDto) {
    await this.findOne(id);

    if (updateBreedDto.name) {
      const existing = await this.breedRepository.findByName(updateBreedDto.name);
      if (existing && existing.id !== id) {
        throw new BusinessException(`Raça com nome "${updateBreedDto.name}" já existe.`);
      }
    }

    return this.breedRepository.update(id, updateBreedDto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.breedRepository.delete(id);
  }
}

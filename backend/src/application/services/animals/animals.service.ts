import { Injectable, Logger, Inject } from '@nestjs/common';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { IAnimalRepository } from '@/domain/repositories/animal.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';

@Injectable()
export class AnimalsService {
  private readonly logger = new Logger(AnimalsService.name);

  constructor(
    @Inject(IAnimalRepository) private animalRepository: IAnimalRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
  ) {}

  private async validateUser(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }
    return user;
  }

  async create(createAnimalDto: CreateAnimalDto) {
    await this.validateUser(createAnimalDto.userId);
    const animal = await this.animalRepository.create(createAnimalDto);

    this.logger.log(
      `Animal cadastrado para usuário ID ${createAnimalDto.userId}`,
    );

    return animal;
  }

  async findAll(associationId?: number) {
    // TODO: Repository doesn't support filtering by associationId yet
    return this.animalRepository.findAllActive();
  }

  async findOne(id: number) {
    const animal = await this.animalRepository.findById(id);

    if (!animal) {
      throw new EntityNotFoundException(`Animal com ID ${id} não encontrado.`);
    }
    return animal;
  }

  async update(id: number, updateAnimalDto: UpdateAnimalDto) {
    await this.findOne(id);
    return this.animalRepository.update(id, updateAnimalDto);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.animalRepository.softDelete(id);
  }

  async findAllByUserId(userId: number) {
    return this.animalRepository.findAllByUserId(userId);
  }
}
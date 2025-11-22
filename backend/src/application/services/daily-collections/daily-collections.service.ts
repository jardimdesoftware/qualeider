import { Injectable, Logger, Inject } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IDailyCollectionRepository } from '@/domain/repositories/daily-collection.repository';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

@Injectable()
export class DailyCollectionsService {
  private readonly logger = new Logger(DailyCollectionsService.name);

  constructor(
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IDailyCollectionRepository) private dailyCollectionRepository: IDailyCollectionRepository,
  ) {}

  private async validateUser(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }
    return user;
  }

  async create(createDailyCollectionDto: CreateDailyCollectionDto) {
    await this.validateUser(createDailyCollectionDto.userId);

    const dailyCollection = await this.dailyCollectionRepository.create(createDailyCollectionDto);

    this.logger.log(
      `Formulário criado para o usuário ID ${createDailyCollectionDto.userId}`,
    );

    return dailyCollection;
  }

  async findAll(associationId?: number) {
    // TODO: Repository doesn't support filtering by associationId yet
    // Need to add findAllByAssociationId() method to IDailyCollectionRepository
    return this.dailyCollectionRepository.findAll();
  }

  async findOne(id: number) {
    const dailyCollection = await this.dailyCollectionRepository.findById(id);

    if (!dailyCollection) {
      throw new EntityNotFoundException(`Coleta diária com ID ${id} não encontrada.`);
    }
    return dailyCollection;
  }

  async update(id: number, updateDailyCollectionDto: UpdateDailyCollectionDto) {
    await this.findOne(id);
    return this.dailyCollectionRepository.update(id, updateDailyCollectionDto);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.dailyCollectionRepository.delete(id);
  }

  async findAllByUserId(userId: number) {
    const dailyCollections = await this.dailyCollectionRepository.findAllByUserId(userId);

    return dailyCollections;
  }
}
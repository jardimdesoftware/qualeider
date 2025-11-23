import { Injectable, Inject, Logger } from '@nestjs/common';
import { IDailyCollectionRepository } from '@/domain/repositories/daily-collection.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BusinessException } from '@/common/exceptions/business.exception';
import { DailyCollectionCriteria } from '@/domain/criteria/daily-collection.criteria';

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

    this.logger.log(`Coleta diária criada (ID: ${dailyCollection.id})`);
    return dailyCollection;
  }

  async findAll(criteria?: DailyCollectionCriteria) {
    return this.dailyCollectionRepository.findAll(criteria);
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
}
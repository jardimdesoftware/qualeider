import { Injectable, Inject, Logger } from '@nestjs/common';
import { IDailyCollectionRepository } from '@/domain/repositories/daily-collection.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IAnimalRepository } from '@/domain/repositories/animal.repository';
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
    @Inject(IAnimalRepository) private animalRepository: IAnimalRepository,
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
    
    this.validateCollectionDate(createDailyCollectionDto.collectionDate);
    
    // Só valida items se o array tiver conteúdo
    if (createDailyCollectionDto.items && createDailyCollectionDto.items.length > 0) {
      this.validateItemsSum(createDailyCollectionDto.quantity, createDailyCollectionDto.items);
      await this.validateAnimalsOwnership(createDailyCollectionDto.userId, createDailyCollectionDto.items);
    }
    
    const dailyCollection = await this.dailyCollectionRepository.create(createDailyCollectionDto);

    this.logger.log(`Coleta diária criada (ID: ${dailyCollection.id})`);
    return dailyCollection;
  }

  private validateCollectionDate(collectionDate: Date) {
    const now = new Date();
    const collectionDateTime = new Date(collectionDate).getTime();
    const nowTime = now.getTime();
    
    if (collectionDateTime > nowTime) {
      throw new BusinessException('Data de coleta não pode ser futura');
    }
  }

  private validateItemsSum(totalQuantity: number, items: Array<{ quantity: number }>) {
    const sum = items.reduce((acc, item) => acc + item.quantity, 0);
    const diff = Math.abs(sum - totalQuantity);
    
    if (diff > 0.01) {
      throw new BusinessException(
        `Soma dos items (${sum.toFixed(2)}L) não corresponde à quantidade total (${totalQuantity.toFixed(2)}L)`,
      );
    }
  }

  private async validateAnimalsOwnership(userId: number, items: Array<{ animalId: number }>) {
    const animalIds = items.map(item => item.animalId);
    
    const animals = await this.animalRepository.findByIds(animalIds);
    
    if (animals.length !== animalIds.length) {
      throw new EntityNotFoundException('Um ou mais animais não foram encontrados');
    }
    
    for (const animal of animals) {
      if (animal.userId !== userId) {
        throw new BusinessException(
          `Animal com ID ${animal.id} não pertence ao usuário`,
        );
      }
    }
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
    
    if (updateDailyCollectionDto.collectionDate) {
      this.validateCollectionDate(updateDailyCollectionDto.collectionDate);
    }
    
    const { items, ...collectionData } = updateDailyCollectionDto;
    
    if (items?.length && updateDailyCollectionDto.quantity) {
      this.validateItemsSum(updateDailyCollectionDto.quantity, items);
    }
    
    await this.dailyCollectionRepository.update(id, collectionData);
    
    if (items && items.length > 0) {
      await this.dailyCollectionRepository.updateItems(id, items);
    }
    
    return this.dailyCollectionRepository.findById(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.dailyCollectionRepository.softDelete(id);
  }
}
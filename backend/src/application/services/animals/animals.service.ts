import { ForbiddenException, Injectable, Inject, Logger } from '@nestjs/common';
import { IAnimalRepository } from '@/domain/repositories/animal.repository';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IDailyCollectionRepository } from '@/domain/repositories/daily-collection.repository';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { AnimalCriteria } from '@/domain/criteria/animal.criteria';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BusinessException } from '@/common/exceptions/business.exception';
import { isSameHerd, resolveHerdScope } from '@/domain/utils/herd-scope.util';
import { UserRole } from '@/domain/enums/enums';

export interface AnimalRequesterContext {
  id: number;
  role?: UserRole;
  associationId?: number | null;
  adminId?: number | null;
}

@Injectable()
export class AnimalsService {
  private readonly logger = new Logger(AnimalsService.name);

  constructor(
    @Inject(IAnimalRepository) private animalRepository: IAnimalRepository,
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

  private assertCanCreateForOwner(
    owner: Awaited<ReturnType<typeof this.validateUser>>,
    requester?: AnimalRequesterContext,
  ) {
    if (!requester) return;

    if (requester.role === UserRole.VAQUEIRO && requester.id !== owner.id) {
      throw new ForbiddenException('Você não tem permissão para cadastrar animais para outro usuário.');
    }

    if (!isSameHerd(requester as any, owner)) {
      throw new ForbiddenException('Você não tem permissão para gerenciar animais deste rebanho.');
    }
  }

  private assertCanManageOwner(
    owner: Awaited<ReturnType<typeof this.validateUser>>,
    requester?: AnimalRequesterContext,
  ) {
    if (!requester) return;

    if (!isSameHerd(requester as any, owner)) {
      throw new ForbiddenException('Você não tem permissão para gerenciar animais deste rebanho.');
    }
  }

  private async assertTagNumberAvailable(
    owner: Awaited<ReturnType<typeof this.validateUser>>,
    tagNumber: string,
    excludeAnimalId?: number,
  ) {
    const scope = resolveHerdScope(owner);
    const conflict = await this.animalRepository.findConflictingTagNumber(
      scope,
      tagNumber,
      excludeAnimalId,
    );
    if (conflict) {
      throw new BusinessException(
        'Já existe um animal com esse número de identificação nesta fazenda.',
      );
    }
  }

  private async validateParent(parentId: number, userId: number, label: string) {
    const parent = await this.animalRepository.findById(parentId);
    if (!parent) {
      throw new EntityNotFoundException(`${label} com ID ${parentId} não encontrado.`);
    }
    if (parent.userId !== userId) {
      throw new BusinessException(`${label} informado não pertence a este produtor.`);
    }
    return parent;
  }

  async create(createAnimalDto: CreateAnimalDto, requester?: AnimalRequesterContext) {
    const owner = await this.validateUser(createAnimalDto.userId);
    this.assertCanCreateForOwner(owner, requester);

    if (createAnimalDto.tagNumber) {
      await this.assertTagNumberAvailable(owner, createAnimalDto.tagNumber);
    }

    if (createAnimalDto.motherId) {
      await this.validateParent(createAnimalDto.motherId, createAnimalDto.userId, 'Mãe');
    }

    if (createAnimalDto.fatherId) {
      await this.validateParent(createAnimalDto.fatherId, createAnimalDto.userId, 'Pai');
    }

    const animal = await this.animalRepository.create(createAnimalDto);

    // Reconciliação automática: se esse animal tem tagNumber, vincula animais
    // que tinham motherCode ou fatherCode com esse número mas sem FK ainda
    if (animal.tagNumber) {
      await this.reconcileParentCodes(animal.userId as number, animal.tagNumber, animal.id as number);
    }

    this.logger.log(`Animal criado: ${animal.tagNumber ?? animal.name} (ID: ${animal.id})`);
    return animal;
  }

  async findAll(criteria?: AnimalCriteria) {
    return this.animalRepository.findAll(criteria);
  }

  async findOne(id: number) {
    const animal = await this.animalRepository.findById(id);
    if (!animal) {
      throw new EntityNotFoundException(`Animal com ID ${id} não encontrado.`);
    }
    return animal;
  }

  async update(id: number, updateAnimalDto: UpdateAnimalDto, requester?: AnimalRequesterContext) {
    const existing = await this.findOne(id);
    const needsOwner = Boolean(
      requester || (updateAnimalDto.tagNumber && updateAnimalDto.tagNumber !== existing.tagNumber),
    );
    const owner = needsOwner ? await this.validateUser(existing.userId as number) : undefined;

    if (owner) {
      this.assertCanManageOwner(owner, requester);
    }

    if (updateAnimalDto.tagNumber && updateAnimalDto.tagNumber !== existing.tagNumber) {
      await this.assertTagNumberAvailable(owner!, updateAnimalDto.tagNumber, id);
    }

    if (updateAnimalDto.motherId) {
      await this.validateParent(updateAnimalDto.motherId, existing.userId as number, 'Mãe');
    }

    if (updateAnimalDto.fatherId) {
      await this.validateParent(updateAnimalDto.fatherId, existing.userId as number, 'Pai');
    }

    const updated = await this.animalRepository.update(id, updateAnimalDto);

    // Se o tagNumber foi atualizado, tentar reconciliar referências pendentes
    if (updateAnimalDto.tagNumber && updateAnimalDto.tagNumber !== existing.tagNumber) {
      await this.reconcileParentCodes(existing.userId as number, updateAnimalDto.tagNumber, id);
    }

    return updated;
  }

  async inativar(id: number, requester?: AnimalRequesterContext) {
    if (requester?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para inativar animais.');
    }

    const existing = await this.findOne(id);
    const owner = await this.validateUser(existing.userId as number);
    this.assertCanManageOwner(owner, requester);
    return this.animalRepository.softDelete(id);
  }

  async remove(id: number, requester?: AnimalRequesterContext) {
    const existing = await this.findOne(id);

    if (requester) {
      const owner = await this.validateUser(existing.userId as number);
      this.assertCanManageOwner(owner, requester);
    }

    const hasCollections = await this.hasCollectionHistory(id);
    if (hasCollections) {
      throw new BusinessException(
        'Não é possível deletar animal com histórico de coletas. Use a opção de inativar.',
      );
    }

    return this.animalRepository.softDelete(id);
  }

  /**
   * Reconciliação automática de parentesco.
   *
   * Quando um animal com tagNumber é cadastrado/atualizado, buscamos animais do
   * mesmo usuário que tinham esse número como motherCode ou fatherCode (texto)
   * mas ainda sem o FK correspondente. Ao encontrá-los, preenchemos a FK real.
   */
  private async reconcileParentCodes(userId: number, tagNumber: string, newAnimalId: number) {
    const pending = await this.animalRepository.findPendingByParentCode(userId, tagNumber);

    for (const child of pending) {
      const patch: { motherId?: number; fatherId?: number } = {};

      if (child.motherCode === tagNumber && !child.motherId) {
        patch.motherId = newAnimalId;
      }
      if (child.fatherCode === tagNumber && !child.fatherId) {
        patch.fatherId = newAnimalId;
      }

      if (Object.keys(patch).length > 0) {
        await this.animalRepository.update(child.id as number, patch);
        this.logger.log(
          `Parentesco reconciliado: animal ID ${child.id} vinculado ao animal ID ${newAnimalId} via tagNumber "${tagNumber}"`,
        );
      }
    }
  }

  private async hasCollectionHistory(animalId: number): Promise<boolean> {
    const count = await this.dailyCollectionRepository.countItemsByAnimalId(animalId);
    return count > 0;
  }
}

import { Injectable, Logger, Inject } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { UserCriteria } from '@/domain/criteria/user.criteria';
import { UserRole } from '@/domain/enums/enums';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(IUserRepository) private readonly userRepository: IUserRepository,
    @Inject(IHashService) private readonly hashService: IHashService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;

    const hashedPassword = await this.hashPasswordIfNeeded(password);

    // Repository lança BusinessException se email duplicar (P2002)
    const user = await this.userRepository.create({
      ...rest,
      role: rest.role ?? UserRole.ADMIN, // garante valor sempre presente
      password: hashedPassword!,
    });

    this.logger.log(`Usuário criado: ${user.email} (ID: ${user.id})`);
    return this.removePassword(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return this.performUpdate(id, updateUserDto);
  }

  async partialUpdate(id: number, updatePartialUserDto: UpdatePartialUserDto) {
    return this.performUpdate(id, updatePartialUserDto);
  }

  async remove(id: number) {
    const deactivated = await this.userRepository.softDelete(id);
    this.logger.log(`Usuário removido (soft delete): ID ${id}`);
    return this.removePassword(deactivated);
  }

  async findByEmail(email: string) {
    this.logger.debug(`Buscando usuário por email: ${email}`);
    return this.userRepository.findByEmail(email);
  }

  async findAll(criteria?: UserCriteria) {
    const result = await this.userRepository.findAll(criteria);
    return {
      ...result,
      data: result.data.map(user => this.removePassword(user))
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException(
        `Usuário com ID ${id} não encontrado ou está inativo.`,
      );
    }
    return this.removePassword(user);
  }

  async exists(id: number): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    return user !== null;
  }

  private async performUpdate(
    id: number,
    data: UpdateUserDto | UpdatePartialUserDto,
  ) {

    const dataToUpdate = await this.prepareUpdateData(data);

    // Repository lança EntityNotFoundException se ID não existir (P2025)
    // Repository lança BusinessException se email duplicar (P2002)
    const updatedUser = await this.userRepository.partialUpdate(id, dataToUpdate);
    
    this.logger.log(`Usuário atualizado: ID ${id}`);
    return this.removePassword(updatedUser);
  }

  private async prepareUpdateData(
    data: UpdateUserDto | UpdatePartialUserDto
  ): Promise<UpdateUserDto | UpdatePartialUserDto> {
    const dataToUpdate = { ...data };

    const hashedPassword = await this.hashPasswordIfNeeded(dataToUpdate.password);
    
    if (hashedPassword) {
      dataToUpdate.password = hashedPassword;
    } else {
      delete dataToUpdate.password;
    }

    return dataToUpdate;
  }

  private async hashPasswordIfNeeded(password?: string): Promise<string | undefined> {
    if (!password || password.trim().length === 0) {
      return undefined;
    }
    
    return this.hashService.hash(password, BCRYPT_ROUNDS_USER_CREATION);
  }

  private removePassword<T>(entity: T): Omit<T, 'password'> {
    if (entity && typeof entity === 'object' && 'password' in entity) {
      const { password, ...rest } = entity as T & { password?: unknown };
      return rest as Omit<T, 'password'>;
    }
    return entity as Omit<T, 'password'>;
  }
}
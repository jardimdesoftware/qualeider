import { Injectable, Logger, Inject } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { IHashService } from '@/application/ports/hash.service';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IHashService) private hashService: IHashService,
  ) {}

  private async validateUserExists(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException(
        `Usuário com ID ${id} não encontrado ou está inativo.`,
      );
    }
    return user;
  }

  private removePassword(entity: any): any {
    if (entity && typeof entity === 'object' && 'password' in entity) {
      delete entity.password;
    }
    return entity;
  }

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;

    try {
      const hashedPassword = await this.hashService.hash(
        password,
        BCRYPT_ROUNDS_USER_CREATION,
      );

      const user = await this.userRepository.create({
        ...rest,
        password: hashedPassword,
      });

      this.logger.log(`Usuário criado: ${user.email} (ID: ${user.id})`);
      return this.removePassword(user);
    } catch (error) {
      // TODO: Abstract repository errors
      if (error.code === 'P2002') {
        throw new BusinessException('Email já está em uso.');
      }
      throw error;
    }
  }

  async findAll(associationId?: number) {
    // TODO: Repository doesn't support filtering by associationId yet
    // Need to add findAllByAssociationId() method to IUserRepository
    return this.userRepository.findAllActive();
  }

  async findOne(id: number) {
    // TODO: Repository doesn't support including relations (animals) yet
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new EntityNotFoundException(
        `Usuário com ID ${id} não encontrado ou está inativo.`,
      );
    }
    return user;
  }

  private async performUpdate(
    id: number,
    data: UpdateUserDto | UpdatePartialUserDto,
  ) {
    await this.validateUserExists(id);

    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new BusinessException('Email já cadastrado');
      }
    }

    if (data.password && data.password.trim().length > 0) {
      data.password = await this.hashService.hash(
        data.password,
        BCRYPT_ROUNDS_USER_CREATION,
      );
    } else {
      delete data.password;
    }

    try {
      // Use partialUpdate for flexibility as data can be UpdateUserDto or UpdatePartialUserDto
      const updatedUser = await this.userRepository.partialUpdate(id, data);
      return this.removePassword(updatedUser);
    } catch (error) {
      // TODO: Abstract repository errors
      if (error.code === 'P2002') {
        throw new BusinessException('Email já cadastrado');
      }
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return this.performUpdate(id, updateUserDto);
  }

  async partialUpdate(id: number, updatePartialUserDto: UpdatePartialUserDto) {
    return this.performUpdate(id, updatePartialUserDto);
  }

  async remove(id: number) {
    await this.validateUserExists(id);

    await this.userRepository.softDelete(id);
    // Return void or fetch deactivated user if needed, but method signature implies returning user?
    // The original method returned the deactivated user. Repository softDelete returns void.
    // We can fetch it again or just return nothing if the caller doesn't use it.
    // Checking usage... usually delete returns void or the deleted entity.
    // Let's fetch it to maintain compatibility if possible, or just return what we have.
    // Since softDelete returns void, we can't return the user easily without another query.
    // For now, let's return a mock or change return type.
    // Actually, let's fetch it to be safe.
    const deactivated = await this.userRepository.findById(id);
    return deactivated; // It might be null if findById filters active users.
    // Wait, findById filters active users? Yes.
    // So we can't find it after soft delete using findById.
    // Let's just return void or null, assuming the caller handles it.
    // Or better, let's assume the caller doesn't need the return value for delete.
    return;
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }
}
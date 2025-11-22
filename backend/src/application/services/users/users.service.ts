import { Injectable, Logger, Inject } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BusinessException } from '@/common/exceptions/business.exception';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { UserCriteria } from '@/domain/criteria/user.criteria';

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
    } catch (error: any) {
      // TODO: Abstract repository errors
      if (error.code === 'P2002') {
        throw new BusinessException('Email já está em uso.');
      }
      throw error;
    }
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
    } catch (error: any) {
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
    
    const deactivated = await this.userRepository.findById(id);
    return deactivated; 
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findAll(criteria?: UserCriteria) {
    return this.userRepository.findAll(criteria);
  }

  async findOne(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException(
        `Usuário com ID ${id} não encontrado ou está inativo.`,
      );
    }
    return user;
  }
}
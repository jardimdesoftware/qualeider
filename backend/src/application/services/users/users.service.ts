import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  private async validateUserExists(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id, status: 'Active' },
    });
    if (!user) {
      throw new EntityNotFoundException(
        `Usuário com ID ${id} não encontrado ou está inativo.`,
      );
    }
    return user;
  }

  private removePassword<T extends Record<string, unknown>>(entity: T): T {
    if (entity && 'password' in entity) {
      delete (entity as { password?: string }).password;
    }
    return entity;
  }

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;

    try {
      const hashedPassword = await bcrypt.hash(
        password,
        BCRYPT_ROUNDS_USER_CREATION,
      );

      const user = await this.prisma.user.create({
        data: {
          ...rest,
          password: hashedPassword,
        },
      });

      this.logger.log(`Usuário criado: ${user.email} (ID: ${user.id})`);
      return this.removePassword(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BusinessException('Email já está em uso.');
        }
      }
      throw error;
    }
  }

  async findAll(associationId?: number) {
    const where: Prisma.UserWhereInput = { status: 'Active' };
    if (associationId !== undefined) {
      where.associationId = associationId;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        userCategory: true,
        city: true,
        state: true,
        status: true,
        associationId: true,
        association: {
          select: { id: true, name: true, city: true },
        },
        createdAt: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id, status: 'Active' },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        userCategory: true,
        city: true,
        state: true,
        status: true,
        createdAt: true,
        animals: {
          orderBy: { id: 'desc' },
          select: { id: true, name: true, breed: true, age: true, createdAt: true },
        },
      },
    });

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
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new BusinessException('Email já cadastrado');
      }
    }

    if (data.password && data.password.trim().length > 0) {
      data.password = await bcrypt.hash(
        data.password,
        BCRYPT_ROUNDS_USER_CREATION,
      );
    } else {
      delete data.password;
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: data as Prisma.UserUpdateInput,
      });
      return this.removePassword(updatedUser);
    } catch (error) {
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

    const deactivated = await this.prisma.user.update({
      where: { id },
      data: { status: 'Inactive' },
    });
    return this.removePassword(deactivated);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
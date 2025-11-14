import {
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  private async findActiveUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id, status: 'Active' },
    });
    if (!user) {
      throw new NotFoundException(
        `Usuário com ID ${id} não encontrado ou está inativo.`,
      );
    }
    return user;
  }

  /**
   * Remove o campo password do objeto retornado (se existir), para evitar vazamento.
   */
  private removePassword<T extends Record<string, unknown>>(entity: T): T {
    if (entity && 'password' in entity) {
      delete (entity as { password?: string }).password;
    }
    return entity;
  }

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

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
          throw new ConflictException('Email já está em uso.');
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

    const users = await this.prisma.user.findMany({
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
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        createdAt: true,
      },
    });
    return users;
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
          select: {
            id: true,
            name: true,
            breed: true,
            age: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuário com ID ${id} não encontrado ou está inativo.`,
      );
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findActiveUserById(id);

    const payload: Prisma.UserUpdateInput = {
      ...updateUserDto,
    } as Prisma.UserUpdateInput;

    if (
      typeof (payload as any).password === 'string' &&
      ((payload as any).password as string).trim().length > 0
    ) {
      (payload as any).password = await bcrypt.hash(
        (payload as any).password as string,
        10,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: payload,
    });

    return this.removePassword(updatedUser);
  }

  async partialUpdate(id: number, updatePartialUserDto: UpdatePartialUserDto) {
    await this.findActiveUserById(id);

    const payload: Prisma.UserUpdateInput = {
      ...updatePartialUserDto,
    } as Prisma.UserUpdateInput;

    if (
      typeof (payload as any).password === 'string' &&
      ((payload as any).password as string).trim().length > 0
    ) {
      (payload as any).password = await bcrypt.hash(
        (payload as any).password as string,
        10,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: payload,
    });

    return this.removePassword(updatedUser);
  }

  async remove(id: number) {
    await this.findActiveUserById(id);

    const deactivated = await this.prisma.user.update({
      where: { id },
      data: { status: 'Inactive' },
    });

    return this.removePassword(deactivated);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}

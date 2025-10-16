import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
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

      // Evita retornar senha
      return this.removePassword(user);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email já está em uso.');
      }
      throw new InternalServerErrorException('Erro ao criar usuário.');
    }
  }

  async findAll() {
    try {
      const users = await this.prisma.user.findMany({
        where: { status: 'Active' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          userType: true,
          userCategory: true,
          city: true,
          state: true,
          status: true,
          createdAt: true,
        },
      });
      return users;
    } catch (error: any) {
      throw new Error('Erro ao buscar usuários: ' + error.message);
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id, status: 'Active' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
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
    } catch (error: any) {
      throw new Error('Erro ao buscar usuário: ' + error.message);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      await this.findActiveUserById(id);

      // Se for informado password, aplica hash antes de salvar
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
    } catch (error: any) {
      throw new Error('Erro ao atualizar usuário: ' + error.message);
    }
  }

  async partialUpdate(id: number, updatePartialUserDto: UpdatePartialUserDto) {
    try {
      await this.findActiveUserById(id);

      // Se for informado password, aplica hash antes de salvar
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
    } catch (error: any) {
      throw new Error('Erro ao atualizar usuário: ' + error.message);
    }
  }

  async remove(id: number) {
    try {
      await this.findActiveUserById(id);

      await this.prisma.user.update({
        where: { id },
        data: { status: 'Inactive' },
      });

      return { message: `Usuário com ID ${id} foi desativado com sucesso.` };
    } catch (error: any) {
      throw new Error('Erro ao desativar usuário: ' + error.message);
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}

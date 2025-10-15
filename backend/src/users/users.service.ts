import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { PatchUserDto } from './dto/patch-user.dto';
import { UpdatePartialUserDto } from './dto/update-partial-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

      delete user.password;
      return user;
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      throw new Error('Erro ao buscar usuário: ' + error.message);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id, status: 'Active' },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com ID ${id} não encontrado ou está inativo.`,
        );
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });

      delete updatedUser.password;
      return updatedUser;
    } catch (error) {
      throw new Error('Erro ao atualizar usuário: ' + error.message);
    }
  }

  async partialUpdate(id: number, updatePartialUserDto: UpdatePartialUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id, status: 'Active' },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com ID ${id} não encontrado ou está inativo.`,
        );
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updatePartialUserDto,
      });

      delete updatedUser.password;
      return updatedUser;
    } catch (error) {
      throw new Error('Erro ao atualizar usuário: ' + error.message);
    }
  }

  // async patch(
  //   id: number,
  //   patchUserDto: PatchUserDto,
  //   userId: number,
  //   userRole: string,
  // ) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id, status: 'Active' },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('Usuário não encontrado ou está inativo.');
  //   }

  //   if (userRole !== 'Admin' && user.id !== userId) {
  //     throw new ForbiddenException('Você não tem permissão para atualizar este usuário.');
  //   }

  //   const updatedUser = await this.prisma.user.update({
  //     where: { id },
  //     data: patchUserDto,
  //   });

  //   delete updatedUser.password;
  //   return updatedUser;
  // }

  async remove(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id, status: 'Active' },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com ID ${id} não encontrado ou já está inativo.`,
        );
      }

      await this.prisma.user.update({
        where: { id },
        data: { status: 'Inactive' },
      });

      return { message: `Usuário com ID ${id} foi desativado com sucesso.` };
    } catch (error) {
      throw new Error('Erro ao desativar usuário: ' + error.message);
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}

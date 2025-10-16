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

      // avoid leaking password back
      if ('password' in (user as Record<string, unknown>)) {
        delete (user as { password?: string }).password;
      }
      return user;
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

      if ('password' in (updatedUser as Record<string, unknown>)) {
        delete (updatedUser as { password?: string }).password;
      }
      return updatedUser;
    } catch (error: any) {
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

      if ('password' in (updatedUser as Record<string, unknown>)) {
        delete (updatedUser as { password?: string }).password;
      }
      return updatedUser;
    } catch (error: any) {
      throw new Error('Erro ao atualizar usuário: ' + error.message);
    }
  }

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

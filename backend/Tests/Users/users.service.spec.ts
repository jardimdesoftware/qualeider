import { UsersService } from '@/application/services/users/users.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      $disconnect: jest.fn().mockResolvedValue(undefined),
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    service = new UsersService(prisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('hashes password and creates user; returns without password', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'U',
        password: 'hashed',
      });

      const result = await service.create({
        name: 'U',
        email: 'u@e.com',
        password: 'plain',
        role: undefined as any,
        userCategory: undefined as any,
        city: 'C',
        state: 'ST',
      } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(prisma.user.create).toHaveBeenCalled();
      expect((result as any).password).toBeUndefined();
    });

    it('throws ConflictException when P2002', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (prisma.user.create as jest.Mock).mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create({
          name: 'U',
          email: 'e',
          password: 'p',
          role: undefined as any,
          userCategory: undefined as any,
          city: 'C',
          state: 'ST',
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws InternalServerErrorException on other errors', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('boom'));

      await expect(
        service.create({
          name: 'U',
          email: 'e',
          password: 'p',
          role: undefined as any,
          userCategory: undefined as any,
          city: 'C',
          state: 'ST',
        } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('returns active users selection', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);
      const res = await service.findAll();
      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(res).toHaveLength(2);
    });

    it('wraps and throws on error', async () => {
      (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('x'));
      await expect(service.findAll()).rejects.toThrow(
        'Erro ao buscar usuários:',
      );
    });
  });

  describe('findOne', () => {
    it('returns selected user when found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      const res = await service.findOne(1);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1, status: 'Active' },
        select: expect.any(Object),
      });
      expect(res).toEqual({ id: 1 });
    });

    it('throws NotFound when not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('wraps and throws on error', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('e'));
      await expect(service.findOne(1)).rejects.toThrow(
        'Erro ao buscar usuário:',
      );
    });
  });

  describe('update', () => {
    it('hashes password when provided and removes it from result', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'Active',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        password: 'hashed',
      });

      const res = await service.update(1, {
        password: 'plain',
        name: 'N',
      } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ name: 'N', password: 'hashed' }),
      });
      expect((res as any).password).toBeUndefined();
    });

    it('does not hash when password empty and still removes password from result', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'Active',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        password: 'should-remove',
      });

      const res = await service.update(1, { name: 'N' } as any);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect((res as any).password).toBeUndefined();
    });

    it('wraps and throws on error', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'Active',
      });
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('u'));
      await expect(service.update(1, { name: 'N' } as any)).rejects.toThrow(
        'Erro ao atualizar usuário:',
      );
    });
  });

  describe('partialUpdate', () => {
    it('hashes password when provided and removes it from result', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'Active',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        password: 'hashed',
      });

      const res = await service.partialUpdate(1, { password: 'plain' } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(prisma.user.update).toHaveBeenCalled();
      expect((res as any).password).toBeUndefined();
    });

    it('wraps and throws on error', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'Active',
      });
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('p'));
      await expect(
        service.partialUpdate(1, { city: 'C' } as any),
      ).rejects.toThrow('Erro ao atualizar usuário:');
    });
  });

  describe('remove', () => {
    it('soft deletes active user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'Active',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const res = await service.remove(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'Inactive' },
      });
      expect(res).toEqual({
        message: 'Usuário com ID 1 foi desativado com sucesso.',
      });
    });

    it('wraps and throws on error', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'Active',
      });
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('r'));
      await expect(service.remove(1)).rejects.toThrow(
        'Erro ao desativar usuário:',
      );
    });
  });

  describe('findByEmail', () => {
    it('delegates to prisma', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'e',
      });
      const res = await service.findByEmail('e');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'e' },
      });
      expect(res).toEqual({ id: 1, email: 'e' });
    });
  });
});

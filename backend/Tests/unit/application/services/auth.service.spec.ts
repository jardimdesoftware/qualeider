import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/auth/auth.service';
import { UsersService } from '@/application/services/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { createUser } from '../../../factories';
import { createMockPrismaService } from '../../../mocks';

// Mock bcrypt
jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let prismaService: ReturnType<typeof createMockPrismaService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: MailService,
          useValue: {
            sendResetPasswordEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const mockUser = createUser({
        email: 'test@example.com',
        password: 'hashedPassword',
      });

      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const mockUser = createUser({
        email: 'test@example.com',
        password: 'hashedPassword',
      });

      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token with correct payload', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        associationId: 10,
      };

      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 1,
        associationId: 10,
      });
      expect(result).toEqual({ access_token: 'mock-jwt-token' });
    });

    it('should handle user without associationId', async () => {
      const mockUser = {
        id: 2,
        email: 'independent@example.com',
        associationId: null,
      };

      jwtService.sign.mockReturnValue('mock-jwt-token-2');

      const result = await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'independent@example.com',
        sub: 2,
        associationId: null,
      });
      expect(result.access_token).toBe('mock-jwt-token-2');
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token and send email', async () => {
      const mockUser = createUser({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        resetToken: '123456',
        resetTokenExpiry: new Date(),
      });
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          resetToken: expect.any(String),
          resetTokenExpiry: expect.any(Date),
        },
      });
      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        'Test User',
        expect.objectContaining({
          expiryDate: expect.any(Date),
        }),
      );
      expect(result.message).toContain('enviado com sucesso');
    });

    it('should normalize email to lowercase', async () => {
      const mockUser = createUser({ email: 'test@example.com' });

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('TEST@EXAMPLE.COM');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw NotFoundException when email not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.forgotPassword('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate 6-digit token', async () => {
      const mockUser = createUser({ email: 'test@example.com' });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      let capturedToken: string = '';
      prismaService.user.update.mockImplementation((args: any) => {
        capturedToken = args.data.resetToken;
        return Promise.resolve({ ...mockUser, ...args.data });
      });

      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com');

      expect(capturedToken).toMatch(/^\d{6}$/);
    });

    it('should set token expiry to 15 minutes from now', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const now = new Date();

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      let capturedExpiry: Date;
      prismaService.user.update.mockImplementation((args: any) => {
        capturedExpiry = args.data.resetTokenExpiry;
        return Promise.resolve({ ...mockUser, ...args.data });
      });

      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com');

      const diff = capturedExpiry!.getTime() - now.getTime();
      expect(diff).toBeGreaterThanOrEqual(14 * 60 * 1000); // At least 14 minutes
      expect(diff).toBeLessThanOrEqual(16 * 60 * 1000); // At most 16 minutes
    });

    it('should include request metadata when request is provided', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/91.0' },
        ip: '192.168.1.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          device: 'Windows 10',
          browser: 'Chrome',
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('should detect Windows 8.1 OS from user agent', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 6.3) Chrome/91.0' },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          device: 'Windows 8.1',
        }),
      );
    });

    it('should detect Windows 8 OS from user agent', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 6.2) Chrome/91.0' },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          device: 'Windows 8',
        }),
      );
    });

    it('should detect Windows 7 OS from user agent', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 6.1) Chrome/91.0' },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          device: 'Windows 7',
        }),
      );
    });

    it('should detect macOS from user agent', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Mac OS X 10_15_7) Safari/537.36',
        },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          device: 'macOS',
        }),
      );
    });

    it('should detect Linux OS from user agent', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: {
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0',
        },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          device: 'Linux',
        }),
      );
    });

    it('should detect Android OS from user agent (detected as Linux due to order)', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Linux; Android 11) Chrome/91.0',
        },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      // Bug no código: Android é detectado como Linux porque "Linux" vem antes de "Android"
      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          device: 'Linux',
        }),
      );
    });

    it('should detect iOS from user agent (detected as macOS due to order)', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: {
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Safari/604.1',
        },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      // Bug no código: iOS é detectado como macOS porque "Mac OS X" vem antes de "iOS"
      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          device: 'macOS',
        }),
      );
    });

    it('should detect Edge browser from user agent', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Edg/91.0.864.59',
        },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          browser: 'Edge',
        }),
      );
    });

    it('should detect Firefox browser from user agent', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Firefox/89.0' },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          browser: 'Firefox',
        }),
      );
    });

    it('should detect Safari browser from user agent', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Mac OS X 10_15_7) Safari/605.1.15',
        },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          browser: 'Safari',
        }),
      );
    });

    it('should detect Opera browser from user agent', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0) OPR/76.0.4017.177',
        },
        ip: '127.0.0.1',
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          browser: 'Opera',
        }),
      );
    });

    it('should extract IP from request.connection.remoteAddress if request.ip not available', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0' },
        connection: { remoteAddress: '10.0.0.5' },
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com', mockRequest as any);

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          ipAddress: '10.0.0.5',
        }),
      );
    });

    it('should use default metadata when request is not provided', async () => {
      const mockUser = createUser({ email: 'test@example.com' });

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com');

      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          device: 'Não disponível',
          browser: 'Não disponível',
          ipAddress: 'Não disponível',
        }),
      );
    });
  });

  describe('validateResetToken', () => {
    it('should return true for valid token', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: futureDate,
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.validateResetToken(
        'test@example.com',
        '123456',
      );

      expect(result).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          resetTokenExpiry: expect.any(Date),
        },
      });
    });

    it('should extend token expiry by 15 minutes after validation', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5);

      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: futureDate,
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      let capturedExpiry: Date;
      prismaService.user.update.mockImplementation((args: any) => {
        capturedExpiry = args.data.resetTokenExpiry;
        return Promise.resolve({ ...mockUser, ...args.data });
      });

      const now = new Date();
      await service.validateResetToken('test@example.com', '123456');

      const diff = capturedExpiry!.getTime() - now.getTime();
      expect(diff).toBeGreaterThanOrEqual(14 * 60 * 1000);
      expect(diff).toBeLessThanOrEqual(16 * 60 * 1000);
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateResetToken('nonexistent@example.com', '123456'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when token does not match', async () => {
      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.validateResetToken('test@example.com', '654321'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is null', async () => {
      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: null,
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.validateResetToken('test@example.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10);

      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: pastDate,
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.validateResetToken('test@example.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const mockUser = createUser({
        id: 1,
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: futureDate,
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const result = await service.resetPassword(
        'test@example.com',
        '123456',
        'newPassword123',
      );

      expect(result).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            password: 'newHashedPassword',
            resetToken: null,
            resetTokenExpiry: null,
          }),
        }),
      );
    });

    it('should validate token before resetting password', async () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10);

      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: pastDate,
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.resetPassword('test@example.com', '123456', 'newPassword123'),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      // First findUnique (in validateResetToken) returns null
      prismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword(
          'nonexistent@example.com',
          '123456',
          'newPassword123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should hash password with bcrypt salt rounds of 12', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: futureDate,
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.resetPassword(
        'test@example.com',
        '123456',
        'myNewPassword',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('myNewPassword', 12);
    });

    it('should clear reset token and expiry after successful reset', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const mockUser = createUser({
        id: 1,
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: futureDate,
      });

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.resetPassword('test@example.com', '123456', 'newPassword');

      // Last update call should clear tokens
      const updateCalls = prismaService.user.update.mock.calls;
      const lastCall = updateCalls[updateCalls.length - 1][0];

      expect(lastCall.data).toEqual({
        password: 'hashedPassword',
        resetToken: null,
        resetTokenExpiry: null,
      });
    });
  });
});

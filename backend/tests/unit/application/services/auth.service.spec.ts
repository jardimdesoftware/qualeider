import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { IUserRepository as IUserRepositorySymbol, type IUserRepository } from '@/domain/repositories/user.repository';
import { MailService } from '@/mail/mail.service';
import {
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { IHashService as IHashServiceSymbol, type IHashService } from '@/application/ports/hash.service';
import { createUser } from '../../../factories';

import { IAssociationRepository } from '@/domain/repositories/association.repository';
import { BCRYPT_ROUNDS_RESET_PASSWORD } from '@/common/constants/security.constants';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let userRepository: IUserRepository;
  let mailService: jest.Mocked<MailService>;
  let hashService: jest.Mocked<IHashService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,

        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: IUserRepositorySymbol,
          useValue: {
            findByEmail: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendResetPasswordEmail: jest.fn(),
          },
        },
        {
          provide: IAssociationRepository,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: IHashServiceSymbol,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    userRepository = module.get<IUserRepository>(IUserRepositorySymbol) as any;
    mailService = module.get(MailService);
    hashService = module.get(IHashServiceSymbol) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('deve retornar usuário sem senha quando credenciais são válidas', async () => {
      const mockUser = createUser({
        email: 'test@example.com',
        password: 'hashedPassword',
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (hashService.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(hashService.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(result).not.toHaveProperty('password');
      expect(result!.email).toBe('test@example.com');
    });

    it('deve retornar null quando usuário não for encontrado', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');
      expect(result).toBeNull();
    });

    it('deve retornar null quando a senha estiver incorreta', async () => {
      const mockUser = createUser({
        email: 'test@example.com',
        password: 'hashedPassword',
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (hashService.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongPassword');
      expect(result).toBeNull();
    });
  });

  describe('executeLogin', () => {
    it('deve realizar login com sucesso quando credenciais são válidas', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockToken = { access_token: 'jwt-token' };

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);
      jest.spyOn(service, 'loginEntity').mockResolvedValue(mockToken);

      const result = await service.executeLogin(loginDto);

      expect(service.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(service.loginEntity).toHaveBeenCalledWith(mockUser, 'user');
      expect(result).toEqual(mockToken);
    });

    it('deve lançar UnauthorizedException quando validação falha', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrong' };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.executeLogin(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('deve retornar token de acesso com payload correto', async () => {
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
        userType: 'user',
      });
      expect(result).toEqual({ access_token: 'mock-jwt-token' });
    });

    it('deve tratar usuário sem associationId', async () => {
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
        userType: 'user',
      });
      expect(result.access_token).toBe('mock-jwt-token-2');
    });
  });

  describe('forgotPassword', () => {
    it('deve gerar token de reset e enviar email', async () => {
      const mockUser = createUser({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetToken: '123456',
        resetTokenExpiry: new Date(),
      });
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@example.com');

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpiry: expect.any(Date),
        }),
      );
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

    it('deve normalizar email para lowercase', async () => {
      const mockUser = createUser({ email: 'test@example.com' });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.update as jest.Mock).mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('TEST@EXAMPLE.COM');

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('deve lançar NotFoundException quando email não for encontrado', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.forgotPassword('nonexistent@example.com'),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('deve gerar token de 6 dígitos', async () => {
      const mockUser = createUser({ email: 'test@example.com' });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      let capturedToken: string = '';
      (userRepository.update as jest.Mock).mockImplementation((_id, data) => {
        capturedToken = data.resetToken;
        return Promise.resolve({ ...mockUser, ...data });
      });

      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com');

      expect(capturedToken).toMatch(/^\d{6}$/);
    });

    it('deve capturar e logar erros durante forgotPassword', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
      const mockUser = createUser({ email: 'test@example.com' });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.update as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.forgotPassword('test@example.com')).rejects.toThrow(
        'DB error',
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Erro ao processar reset de senha:',
        expect.any(Error),
      );

      loggerErrorSpy.mockRestore();
    });

    it('deve definir expiração do token para 15 minutos a partir de agora', async () => {
      const mockUser = createUser({ email: 'test@example.com' });
      const now = new Date();

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      let capturedExpiry: Date;
      (userRepository.update as jest.Mock).mockImplementation((_id, data) => {
        capturedExpiry = data.resetTokenExpiry;
        return Promise.resolve({ ...mockUser, ...data });
      });

      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      await service.forgotPassword('test@example.com');

      const diff = capturedExpiry!.getTime() - now.getTime();
      expect(diff).toBeGreaterThanOrEqual(14 * 60 * 1000); // At least 14 minutes
      expect(diff).toBeLessThanOrEqual(16 * 60 * 1000); // At most 16 minutes
    });
  });

  describe('validateResetToken', () => {
    it('deve retornar usuário para token válido', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: futureDate,
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateResetToken(
        'test@example.com',
        '123456',
      );

      expect(result).toEqual(mockUser);
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        {
          resetTokenExpiry: expect.any(Date),
        },
      );
    });

    it('deve estender expiração do token em 15 minutos após validação', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5);

      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: futureDate,
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      let capturedExpiry: Date;
      (userRepository.update as jest.Mock).mockImplementation((_id, data) => {
        capturedExpiry = data.resetTokenExpiry;
        return Promise.resolve({ ...mockUser, ...data });
      });

      const now = new Date();
      await service.validateResetToken('test@example.com', '123456');

      const diff = capturedExpiry!.getTime() - now.getTime();
      expect(diff).toBeGreaterThanOrEqual(14 * 60 * 1000);
      expect(diff).toBeLessThanOrEqual(16 * 60 * 1000);
    });

    it('deve lançar NotFoundException quando usuário não for encontrado', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.validateResetToken('nonexistent@example.com', '123456'),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('deve lançar UnauthorizedException quando token não coincidir', async () => {
      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.validateResetToken('test@example.com', '654321'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando token for nulo', async () => {
      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: null,
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.validateResetToken('test@example.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando token estiver expirado', async () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10);

      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: pastDate,
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.validateResetToken('test@example.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('deve resetar a senha com sucesso', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const mockUser = createUser({
        id: 1,
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: futureDate,
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.update as jest.Mock).mockResolvedValue(mockUser);
      (hashService.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const result = await service.resetPassword(
        'test@example.com',
        '123456',
        'newPassword123',
      );

      expect(result).toBe(true);
      expect(hashService.hash).toHaveBeenCalledWith(
        'newPassword123',
        BCRYPT_ROUNDS_RESET_PASSWORD,
      );
      expect(userRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          password: 'newHashedPassword',
          resetToken: null,
          resetTokenExpiry: null,
        }),
      );
    });

    it('deve validar token antes de resetar a senha', async () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10);

      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: pastDate,
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.resetPassword('test@example.com', '123456', 'newPassword123'),
      ).rejects.toThrow(UnauthorizedException);

      expect(hashService.hash).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando usuário não for encontrado', async () => {
      // First findUnique (in validateResetToken) returns null
      (userRepository.findByEmail as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.resetPassword(
          'nonexistent@example.com',
          '123456',
          'newPassword123',
        ),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('deve hashear a senha com 12 salt rounds do bcrypt', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const mockUser = createUser({
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: futureDate,
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.update as jest.Mock).mockResolvedValue(mockUser);
      (hashService.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.resetPassword(
        'test@example.com',
        '123456',
        'myNewPassword',
      );

      expect(hashService.hash).toHaveBeenCalledWith(
        'myNewPassword',
        BCRYPT_ROUNDS_RESET_PASSWORD,
      );
    });

    it('deve limpar reset token e expiry após reset bem-sucedido', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      const mockUser = createUser({
        id: 1,
        email: 'test@example.com',
        resetToken: '123456',
        resetTokenExpiry: futureDate,
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.update as jest.Mock).mockResolvedValue(mockUser);
      (hashService.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.resetPassword('test@example.com', '123456', 'newPassword');

      // Last update call should clear tokens
      const updateCalls = (userRepository.update as jest.Mock).mock.calls;
      const lastCall = updateCalls[updateCalls.length - 1];

      expect(lastCall[1]).toEqual({
        password: 'hashedPassword',
        resetToken: null,
        resetTokenExpiry: null,
      });
    });
  });
});

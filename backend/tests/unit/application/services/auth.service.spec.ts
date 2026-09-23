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
import { IFailedEmailRepository } from '@/domain/repositories/failed-email.repository';
import { IAllowedEmailRepository } from '@/domain/repositories/allowed-email.repository';
import { ConfigService } from '@nestjs/config';
import {
  BCRYPT_ROUNDS_RESET_PASSWORD,
  BCRYPT_ROUNDS_USER_CREATION,
} from '@/common/constants/security.constants';
import { Status, UserCategory, UserRole } from '@/domain/enums/enums';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let userRepository: IUserRepository;
  let mailService: jest.Mocked<MailService>;
  let hashService: jest.Mocked<IHashService>;
  let associationRepository: IAssociationRepository;
  let failedEmailRepository: jest.Mocked<IFailedEmailRepository>;
  let allowedEmailRepository: jest.Mocked<IAllowedEmailRepository>;
  let configService: jest.Mocked<ConfigService>;

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
            create: jest.fn(),
            findByEmail: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            findFirstAdmin: jest.fn(),
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
        {
          provide: IFailedEmailRepository,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: IAllowedEmailRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByEmail: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    userRepository = module.get<IUserRepository>(IUserRepositorySymbol) as any;
    mailService = module.get(MailService);
    hashService = module.get(IHashServiceSymbol) as any;
    associationRepository = module.get<IAssociationRepository>(IAssociationRepository) as any;
    failedEmailRepository = module.get(IFailedEmailRepository);
    allowedEmailRepository = module.get(IAllowedEmailRepository);
    configService = module.get(ConfigService);
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

    it('regressão #169: deve rejeitar login com UnauthorizedException quando a conta esta inativa (credenciais corretas)', async () => {
      const mockUser = createUser({
        email: 'vaqueiro@example.com',
        password: 'hashedPassword',
        status: Status.Inactive,
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (hashService.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validateUser('vaqueiro@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.validateUser('vaqueiro@example.com', 'password123'),
      ).rejects.toThrow('Conta inativa. Entre em contato com o administrador.');
    });
  });

  describe('validateAssociation', () => {
    it('deve retornar associação sem senha quando credenciais são válidas', async () => {
      const mockAssociation = {
        id: 1,
        email: 'assoc@example.com',
        password: 'hashedPassword',
      };

      (associationRepository.findByEmail as jest.Mock).mockResolvedValue(
        mockAssociation,
      );
      (hashService.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateAssociation(
        'assoc@example.com',
        'password123',
      );

      expect(associationRepository.findByEmail).toHaveBeenCalledWith(
        'assoc@example.com',
      );
      expect(hashService.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(result).not.toHaveProperty('password');
      expect(result!.email).toBe('assoc@example.com');
    });

    it('deve retornar null quando associação não for encontrada', async () => {
      (associationRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.validateAssociation(
        'nonexistent@example.com',
        'password123',
      );
      expect(result).toBeNull();
    });

    it('deve retornar null quando a senha da associação estiver incorreta', async () => {
      const mockAssociation = {
        email: 'assoc@example.com',
        password: 'hashedPassword',
      };

      (associationRepository.findByEmail as jest.Mock).mockResolvedValue(
        mockAssociation,
      );
      (hashService.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateAssociation(
        'assoc@example.com',
        'wrong',
      );
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



    it('deve realizar login como associação quando login de usuário falha', async () => {
      const loginDto = { email: 'assoc@example.com', password: 'password123' };
      const mockAssociation = { id: 1, email: 'assoc@example.com' };
      const mockToken = { access_token: 'jwt-token-assoc' };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);
      jest.spyOn(service, 'validateAssociation').mockResolvedValue(mockAssociation as any);
      jest.spyOn(service, 'loginEntity').mockResolvedValue(mockToken);

      const result = await service.executeLogin(loginDto);

      expect(service.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(service.validateAssociation).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(service.loginEntity).toHaveBeenCalledWith(mockAssociation, 'association');
      expect(result).toEqual(mockToken);
    });

    it('deve lançar UnauthorizedException quando validação falha para ambos', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrong' };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);
      jest.spyOn(service, 'validateAssociation').mockResolvedValue(null);

      await expect(service.executeLogin(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('regressão #169: propaga o erro de conta inativa sem cair no fallback de Associação', async () => {
      const loginDto = { email: 'vaqueiro@example.com', password: 'password123' };
      const inactiveError = new UnauthorizedException(
        'Conta inativa. Entre em contato com o administrador.',
      );

      jest.spyOn(service, 'validateUser').mockRejectedValue(inactiveError);
      jest.spyOn(service, 'validateAssociation');

      await expect(service.executeLogin(loginDto)).rejects.toThrow(
        'Conta inativa. Entre em contato com o administrador.',
      );
      expect(service.validateAssociation).not.toHaveBeenCalled();
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
        role: null,
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
        role: null,
      });
      expect(result.access_token).toBe('mock-jwt-token-2');
    });
  });

  describe('Google OAuth', () => {
    it('deve montar URL de autenticação do Google com os parâmetros esperados', () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        const values: Record<string, string> = {
          GOOGLE_CLIENT_ID: 'google-client-id',
          GOOGLE_CALLBACK_URL: 'https://example.com/auth/google/callback',
        };
        return values[key];
      });

      const url = service.getGoogleAuthUrl();
      const parsed = new URL(url);

      expect(parsed.origin + parsed.pathname).toBe(
        'https://accounts.google.com/o/oauth2/v2/auth',
      );
      expect(parsed.searchParams.get('client_id')).toBe('google-client-id');
      expect(parsed.searchParams.get('redirect_uri')).toBe(
        'https://example.com/auth/google/callback',
      );
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('scope')).toBe('openid email profile');
      expect(parsed.searchParams.get('prompt')).toBe('select_account');
    });

    it('deve lançar UnauthorizedException quando a troca de code por token falhar', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      await expect(service.handleGoogleCallback('invalid-code')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando email do Google não estiver verificado', async () => {
      const payload = {
        sub: 'sub-1',
        email: 'test@ifpe.edu.br',
        email_verified: false,
        name: 'Test User',
      };
      const idToken = `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

      jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: idToken }),
      } as Response);

      await expect(service.handleGoogleCallback('valid-code')).rejects.toThrow(
        'Email do Google não verificado.',
      );
    });

    it('deve autenticar com sucesso ao receber id_token válido e email verificado', async () => {
      const payload = {
        sub: 'sub-1',
        email: 'valid@ifpe.edu.br',
        email_verified: true,
        name: 'Valid User',
      };
      const idToken = `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
      const loginResult = { access_token: 'google-token' };

      jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: idToken }),
      } as Response);
      jest.spyOn(service, 'loginWithGoogle').mockResolvedValue(loginResult as any);

      const result = await service.handleGoogleCallback('valid-code');

      expect(service.loginWithGoogle).toHaveBeenCalledWith({
        email: 'valid@ifpe.edu.br',
        name: 'Valid User',
      });
      expect(result).toEqual(loginResult);
    });

    it('deve rejeitar login com Google para email não autorizado', async () => {
      (allowedEmailRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.loginWithGoogle({ email: 'outside@example.com' }),
      ).rejects.toThrow(
        'Este email não tem acesso. Peça para um administrador liberar seu email na tela de Funcionários.',
      );
    });

    it('deve rejeitar usuário existente inativo no login com Google', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(
        createUser({
          email: 'user@ifpe.edu.br',
          status: Status.Inactive,
        }),
      );

      await expect(
        service.loginWithGoogle({ email: 'user@ifpe.edu.br' }),
      ).rejects.toThrow('Conta inativa. Entre em contato com o administrador.');
    });

    it('deve autenticar usuário existente ativo no login com Google', async () => {
      const existingUser = createUser({
        email: 'active@ifpe.edu.br',
        status: Status.Active,
      });
      const loginResult = { access_token: 'existing-user-token' };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(existingUser);
      jest.spyOn(service, 'loginEntity').mockResolvedValue(loginResult);

      const result = await service.loginWithGoogle({
        email: 'active@ifpe.edu.br',
      });

      expect(service.loginEntity).toHaveBeenCalledWith(existingUser, 'user');
      expect(result).toEqual(loginResult);
    });

    it('deve rejeitar criação de conta via Google quando não existir administrador', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.findFirstAdmin as jest.Mock).mockResolvedValue(null);

      await expect(
        service.loginWithGoogle({ email: 'new@ifpe.edu.br' }),
      ).rejects.toThrow('Ainda não há um administrador cadastrado no sistema.');
    });

    it('deve criar usuário no primeiro login via Google e autenticar', async () => {
      const admin = createUser({ id: 77, role: UserRole.ADMIN });
      const createdUser = createUser({
        id: 88,
        email: 'new@ifpe.edu.br',
        role: UserRole.VAQUEIRO,
      });
      const loginResult = { access_token: 'new-user-token' };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.findFirstAdmin as jest.Mock).mockResolvedValue(admin);
      (hashService.hash as jest.Mock).mockResolvedValue('hashed-random-password');
      (userRepository.create as jest.Mock).mockResolvedValue(createdUser);
      jest.spyOn(service, 'loginEntity').mockResolvedValue(loginResult);

      const result = await service.loginWithGoogle({
        email: 'NEW@IFPE.EDU.BR',
      });

      expect(hashService.hash).toHaveBeenCalledWith(
        expect.any(String),
        BCRYPT_ROUNDS_USER_CREATION,
      );
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'new',
          email: 'new@ifpe.edu.br',
          role: UserRole.VAQUEIRO,
          userCategory: UserCategory.Fisica,
          city: 'Não informado',
          state: 'PE',
          adminId: 77,
          password: 'hashed-random-password',
        }),
      );
      expect(service.loginEntity).toHaveBeenCalledWith(createdUser, 'user');
      expect(result).toEqual(loginResult);
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

    it('regressão #168: nao deve retornar 500 quando o envio do email falha (ex: SMTP fora do ar)', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
      const mockUser = createUser({ id: 1, email: 'test@example.com', name: 'Test User' });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetToken: '123456',
        resetTokenExpiry: new Date(),
      });
      mailService.sendResetPasswordEmail.mockRejectedValue(
        new Error('connect ETIMEDOUT: SMTP indisponível'),
      );
      (failedEmailRepository.create as jest.Mock).mockResolvedValue({});

      // O token ja foi persistido; a requisicao nao deve lancar/virar 500.
      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('enviado com sucesso');
      expect(failedEmailRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ to: 'test@example.com' }),
          errorReason: expect.stringContaining('SMTP indisponível'),
        }),
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Falha ao enviar e-mail de redefinição de senha'),
        expect.any(Error),
      );

      loggerErrorSpy.mockRestore();
    });

    it('regressão #168: registra falha na DLQ mesmo se o proprio salvamento na DLQ falhar (nao deve quebrar a requisicao)', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
      const mockUser = createUser({ id: 1, email: 'test@example.com', name: 'Test User' });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.update as jest.Mock).mockResolvedValue(mockUser);
      mailService.sendResetPasswordEmail.mockRejectedValue(new Error('SMTP indisponível'));
      (failedEmailRepository.create as jest.Mock).mockRejectedValue(new Error('DB indisponível'));

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('enviado com sucesso');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'CRÍTICO: Falha ao salvar e-mail de redefinição de senha na DLQ!',
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

import { Test, TestingModule } from '@nestjs/testing';
import { InviteDomainService } from '@/domain/services/invite.domain-service';
import { InviteEntity } from '@/domain/entities/invite.entity';
import { InviteStatus } from '@/domain/enums/enums';
import { BusinessException } from '@/common/exceptions/business.exception';
import { INVITE_EXPIRATION_DAYS } from '@/common/constants/business-rules.constants';

describe('InviteDomainService', () => {
  let service: InviteDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InviteDomainService],
    }).compile();

    service = module.get<InviteDomainService>(InviteDomainService);
  });

  describe('calculateExpirationDate', () => {
    it('deve retornar uma data futura baseada na constante', () => {
      const now = new Date();
      const expirationDate = service.calculateExpirationDate();
      
      const diffTime = Math.abs(expirationDate.getTime() - now.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
      
      expect(diffDays).toBeCloseTo(INVITE_EXPIRATION_DAYS, 0);
    });
  });

  describe('validateForAcceptance', () => {
    it('deve passar se o convite estiver PENDENTE e não expirado', () => {
      const invite = {
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 10000),
      } as InviteEntity;

      expect(() => service.validateForAcceptance(invite)).not.toThrow();
    });

    it('deve lançar erro se o convite não estiver PENDENTE', () => {
      const invite = {
        status: InviteStatus.ACCEPTED,
        expiresAt: new Date(Date.now() + 10000),
      } as InviteEntity;

      expect(() => service.validateForAcceptance(invite)).toThrow(BusinessException);
    });

    it('deve lançar erro se o convite estiver expirado', () => {
      const invite = {
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() - 10000),
      } as InviteEntity;

      expect(() => service.validateForAcceptance(invite)).toThrow(BusinessException);
    });
  });

  describe('accept', () => {
    it('deve alterar o status para ACCEPTED e definir respondedAt', () => {
      const invite = {
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 10000),
      } as InviteEntity;

      const result = service.accept(invite);

      expect(result.status).toBe(InviteStatus.ACCEPTED);
      expect(result.respondedAt).toBeDefined();
    });
  });

  describe('decline', () => {
    it('deve alterar o status para DECLINED e definir respondedAt', () => {
      const invite = {
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 10000),
      } as InviteEntity;

      const result = service.decline(invite);

      expect(result.status).toBe(InviteStatus.DECLINED);
      expect(result.respondedAt).toBeDefined();
    });

    it('deve lançar erro se tentar recusar convite não pendente', () => {
      const invite = {
        status: InviteStatus.ACCEPTED,
      } as InviteEntity;

      expect(() => service.decline(invite)).toThrow(BusinessException);
    });
  });
  describe('cancel', () => {
    it('deve alterar o status para CANCELED e definir respondedAt', () => {
      const invite = {
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 10000),
      } as InviteEntity;

      const result = service.cancel(invite);

      expect(result.status).toBe(InviteStatus.CANCELED);
      expect(result.respondedAt).toBeDefined();
    });

    it('deve lançar erro se tentar cancelar convite não pendente', () => {
      const invite = {
        status: InviteStatus.ACCEPTED,
      } as InviteEntity;

      expect(() => service.cancel(invite)).toThrow(BusinessException);
    });
  });

  describe('isExpired', () => {
    it('deve retornar true se a data atual for maior que expiresAt', () => {
      const invite = {
        expiresAt: new Date(Date.now() - 10000),
      } as InviteEntity;

      expect(service.isExpired(invite)).toBe(true);
    });

    it('deve retornar false se a data atual for menor que expiresAt', () => {
      const invite = {
        expiresAt: new Date(Date.now() + 10000),
      } as InviteEntity;

      expect(service.isExpired(invite)).toBe(false);
    });
  });
});

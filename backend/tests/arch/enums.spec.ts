import { 
  UserCategory as PrismaUserCategory,
  UserType as PrismaUserType,
  Status as PrismaStatus,
  AnimalType as PrismaAnimalType,
  CoverageArea as PrismaCoverageArea,
  MilkingPlace as PrismaMilkingPlace,
  InviteStatus as PrismaInviteStatus
} from '@prisma/client';

import { 
  UserCategory as DomainUserCategory,
  UserType as DomainUserType,
  Status as DomainStatus,
  AnimalType as DomainAnimalType,
  CoverageArea as DomainCoverageArea,
  MilkingPlace as DomainMilkingPlace,
  InviteStatus as DomainInviteStatus
} from '@/domain/enums/enums';

describe('Enums Consistency - Prisma vs Domain', () => {
  describe('UserCategory', () => {
    it('deve ter as mesmas categorias de usuário no Prisma e no Domínio', () => {
      const prismaKeys = Object.keys(PrismaUserCategory).sort();
      const domainKeys = Object.keys(DomainUserCategory).sort();
      
      expect(domainKeys).toEqual(prismaKeys);
    });

    it('deve ter os mesmos valores no Prisma e no Domínio', () => {
      const prismaValues = Object.values(PrismaUserCategory).sort();
      const domainValues = Object.values(DomainUserCategory).sort();
      
      expect(domainValues).toEqual(prismaValues);
    });
  });

  describe('UserType', () => {
    it('deve ter os mesmos tipos de usuário no Prisma e no Domínio', () => {
      const prismaKeys = Object.keys(PrismaUserType).sort();
      const domainKeys = Object.keys(DomainUserType).sort();
      
      expect(domainKeys).toEqual(prismaKeys);
    });

    it('deve ter os mesmos valores no Prisma e no Domínio', () => {
      const prismaValues = Object.values(PrismaUserType).sort();
      const domainValues = Object.values(DomainUserType).sort();
      
      expect(domainValues).toEqual(prismaValues);
    });
  });

  describe('Status', () => {
    it('deve ter os mesmos status no Prisma e no Domínio', () => {
      const prismaKeys = Object.keys(PrismaStatus).sort();
      const domainKeys = Object.keys(DomainStatus).sort();
      
      expect(domainKeys).toEqual(prismaKeys);
    });

    it('deve ter os mesmos valores no Prisma e no Domínio', () => {
      const prismaValues = Object.values(PrismaStatus).sort();
      const domainValues = Object.values(DomainStatus).sort();
      
      expect(domainValues).toEqual(prismaValues);
    });
  });

  describe('AnimalType', () => {
    it('deve ter os mesmos tipos de animais no Prisma e no Domínio', () => {
      const prismaKeys = Object.keys(PrismaAnimalType).sort();
      const domainKeys = Object.keys(DomainAnimalType).sort();
      
      expect(domainKeys).toEqual(prismaKeys);
    });

    it('deve ter os mesmos valores no Prisma e no Domínio', () => {
      const prismaValues = Object.values(PrismaAnimalType).sort();
      const domainValues = Object.values(DomainAnimalType).sort();
      
      expect(domainValues).toEqual(prismaValues);
    });
  });

  describe('CoverageArea', () => {
    it('deve ter as mesmas áreas de cobertura no Prisma e no Domínio', () => {
      const prismaKeys = Object.keys(PrismaCoverageArea).sort();
      const domainKeys = Object.keys(DomainCoverageArea).sort();
      
      expect(domainKeys).toEqual(prismaKeys);
    });

    it('deve ter os mesmos valores no Prisma e no Domínio', () => {
      const prismaValues = Object.values(PrismaCoverageArea).sort();
      const domainValues = Object.values(DomainCoverageArea).sort();
      
      expect(domainValues).toEqual(prismaValues);
    });
  });

  describe('MilkingPlace', () => {
    it('deve ter os mesmos locais de ordenha no Prisma e no Domínio', () => {
      const prismaKeys = Object.keys(PrismaMilkingPlace).sort();
      const domainKeys = Object.keys(DomainMilkingPlace).sort();
      
      expect(domainKeys).toEqual(prismaKeys);
    });

    it('deve ter os mesmos valores no Prisma e no Domínio', () => {
      const prismaValues = Object.values(PrismaMilkingPlace).sort();
      const domainValues = Object.values(DomainMilkingPlace).sort();
      
      expect(domainValues).toEqual(prismaValues);
    });
  });

  describe('InviteStatus', () => {
    it('deve ter os mesmos status de convite no Prisma e no Domínio', () => {
      const prismaKeys = Object.keys(PrismaInviteStatus).sort();
      const domainKeys = Object.keys(DomainInviteStatus).sort();
      
      expect(domainKeys).toEqual(prismaKeys);
    });

    it('deve ter os mesmos valores no Prisma e no Domínio', () => {
      const prismaValues = Object.values(PrismaInviteStatus).sort();
      const domainValues = Object.values(DomainInviteStatus).sort();
      
      expect(domainValues).toEqual(prismaValues);
    });
  });
});

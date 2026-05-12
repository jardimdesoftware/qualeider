import { UserEntity } from '@/domain/entities/user.entity';
import { Status, UserCategory, UserRole, UserType } from '@/domain/enums/enums';

describe('UserEntity (domain)', () => {
  it('deve permitir construir um objeto de usuário simples', () => {
    const now = new Date();
    const user: UserEntity = {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed',
      role: UserRole.ADMIN,
      userCategory: UserCategory.Fisica,
      city: 'City',
      state: 'ST',
      status: Status.Active,
      createdAt: now,
      updatedAt: now,
    };

    expect(user.email).toBe('alice@example.com');
    expect(user.status).toBe(Status.Active);
  });

  it('deve suportar propriedades opcionais', () => {
    const now = new Date();
    const user: UserEntity = {
      id: 2,
      name: 'Bob',
      email: 'bob@example.com',
      password: 'hashed',
      role: UserRole.ADMIN,
      userCategory: UserCategory.Fisica,
      city: 'Town',
      state: 'TS',
      status: Status.Active,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: now,
      updatedAt: now,
    };

    expect(user.resetToken).toBeNull();
    expect(user.resetTokenExpiry).toBeNull();
  });

  describe('resetToken fields', () => {
    it('deve permitir resetToken com data de expiração', () => {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 3600000); // 1 hour from now

      const user: UserEntity = {
        id: 3,
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Fisica,
        city: 'Village',
        state: 'VG',
        status: Status.Active,
        resetToken: 'abc123token',
        resetTokenExpiry: expiryDate,
        createdAt: now,
        updatedAt: now,
      };

      expect(user.resetToken).toBe('abc123token');
      expect(user.resetTokenExpiry).toEqual(expiryDate);
      expect(user.resetTokenExpiry!.getTime()).toBeGreaterThan(now.getTime());
    });

    it('deve permitir campos resetToken indefinidos', () => {
      const now = new Date();
      const user: UserEntity = {
        id: 4,
        name: 'Diana',
        email: 'diana@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Juridica,
        city: 'Metro',
        state: 'MT',
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(user.resetToken).toBeUndefined();
      expect(user.resetTokenExpiry).toBeUndefined();
    });
  });

  describe('userType field', () => {
    it('deve permitir userType para categorização', () => {
      const now = new Date();
      const user: UserEntity = {
        id: 8,
        name: 'Henry',
        email: 'henry@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Fisica,
        userType: UserType.Pecuarista,
        city: 'Field',
        state: 'FD',
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(user.userType).toBe(UserType.Pecuarista);
    });

    it('deve permitir diferentes valores de userType', () => {
      const now = new Date();
      const cooperativa: UserEntity = {
        id: 9,
        name: 'Coop ABC',
        email: 'coop@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Juridica,
        userType: UserType.Cooperativa,
        city: 'Capital',
        state: 'CP',
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(cooperativa.userType).toBe(UserType.Cooperativa);
    });

    it('deve permitir userType indefinido', () => {
      const now = new Date();
      const user: UserEntity = {
        id: 10,
        name: 'Ivy',
        email: 'ivy@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Fisica,
        city: 'Coast',
        state: 'CT',
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(user.userType).toBeUndefined();
    });
  });

  describe('status values', () => {
    it('deve suportar status Active', () => {
      const now = new Date();
      const user: UserEntity = {
        id: 11,
        name: 'Jack',
        email: 'jack@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Fisica,
        city: 'Port',
        state: 'PT',
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(user.status).toBe(Status.Active);
    });

    it('deve suportar status Inactive', () => {
      const now = new Date();
      const user: UserEntity = {
        id: 12,
        name: 'Kate',
        email: 'kate@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Fisica,
        city: 'Bay',
        state: 'BY',
        status: Status.Inactive,
        createdAt: now,
        updatedAt: now,
      };

      expect(user.status).toBe(Status.Inactive);
    });
  });

  describe('userCategory values', () => {
    it('deve suportar categoria Fisica', () => {
      const now = new Date();
      const user: UserEntity = {
        id: 13,
        name: 'Leo',
        email: 'leo@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Fisica,
        city: 'Lake',
        state: 'LK',
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(user.userCategory).toBe(UserCategory.Fisica);
    });

    it('deve suportar categoria Juridica', () => {
      const now = new Date();
      const user: UserEntity = {
        id: 14,
        name: 'Company XYZ',
        email: 'company@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Juridica,
        city: 'Business District',
        state: 'BD',
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(user.userCategory).toBe(UserCategory.Juridica);
    });
  });

  describe('timestamps', () => {
    it('deve ter timestamps createdAt e updatedAt', () => {
      const now = new Date();
      const user: UserEntity = {
        id: 15,
        name: 'Mia',
        email: 'mia@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Fisica,
        city: 'River',
        state: 'RV',
        status: Status.Active,
        createdAt: now,
        updatedAt: now,
      };

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.createdAt).toEqual(user.updatedAt);
    });

    it('deve permitir valores diferentes de createdAt e updatedAt', () => {
      const createdDate = new Date('2025-01-01');
      const updatedDate = new Date('2025-11-14');

      const user: UserEntity = {
        id: 16,
        name: 'Noah',
        email: 'noah@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        userCategory: UserCategory.Fisica,
        city: 'Mountain',
        state: 'MN',
        status: Status.Active,
        createdAt: createdDate,
        updatedAt: updatedDate,
      };

      expect(user.updatedAt.getTime()).toBeGreaterThan(
        user.createdAt.getTime(),
      );
    });
  });
});

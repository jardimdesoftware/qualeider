import { UserEntity } from '@/domain/entities/user.entity';
import { Role, Status, UserCategory } from '@/domain/enums/enums';

describe('UserEntity (domain)', () => {
  it('should allow constructing a plain user object', () => {
    const now = new Date();
    const user: UserEntity = {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed',
      role: Role.Common,
      userCategory: UserCategory.Fisica,
      city: 'City',
      state: 'ST',
      status: Status.Active,
      createdAt: now,
      updatedAt: now,
    };

    expect(user.email).toBe('alice@example.com');
    expect(user.role).toBe(Role.Common);
    expect(user.status).toBe(Status.Active);
  });

  it('should support optional properties', () => {
    const now = new Date();
    const user: UserEntity = {
      id: 2,
      name: 'Bob',
      email: 'bob@example.com',
      password: 'hashed',
      role: Role.Common,
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
});

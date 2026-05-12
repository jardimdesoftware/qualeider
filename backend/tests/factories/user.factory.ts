import { UserEntity } from '@/domain/entities/user.entity';
import { Status, UserCategory, UserRole, UserType } from '@/domain/enums/enums';

/**
 * Factory para criar entidades User com dados válidos para testes
 * Permite sobrescrever campos específicos conforme necessário
 */
export class UserFactory {
  private static counter = 1;

  /**
   * Cria um UserEntity completo com valores padrão
   * @param overrides - Campos para sobrescrever os valores padrão
   */
  static create(overrides: Partial<UserEntity> = {}): UserEntity {
    const id = UserFactory.counter++;
    const timestamp = new Date();

    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      password: '$2a$10$hashedPasswordExample', // bcrypt hash simulado
      role: UserRole.ADMIN,
      userCategory: UserCategory.Fisica,
      userType: UserType.Pecuarista,
      city: 'Belo Jardim',
      state: 'PE',
      status: Status.Active,
      createdAt: timestamp,
      updatedAt: timestamp,
      resetToken: null,
      resetTokenExpiry: null,
      associationId: null,
      document: null,
      ...overrides,
    };
  }

  /**
   * Cria um User associado a uma associação
   */
  static createWithAssociation(
    associationId: number,
    overrides: Partial<UserEntity> = {},
  ): UserEntity {
    return UserFactory.create({
      associationId,
      ...overrides,
    });
  }

  /**
   * Cria um User com token de reset de senha
   */
  static createWithResetToken(overrides: Partial<UserEntity> = {}): UserEntity {
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15); // Expira em 15 minutos

    return UserFactory.create({
      resetToken: '123456',
      resetTokenExpiry,
      ...overrides,
    });
  }

  /**
   * Cria um User inativo
   */
  static createInactive(overrides: Partial<UserEntity> = {}): UserEntity {
    return UserFactory.create({
      status: Status.Inactive,
      ...overrides,
    });
  }

  /**
   * Cria múltiplos Users
   */
  static createMany(
    count: number,
    overrides: Partial<UserEntity> = {},
  ): UserEntity[] {
    return Array.from({ length: count }, () => UserFactory.create(overrides));
  }

  /**
   * Reseta o contador de IDs (útil para testes isolados)
   */
  static resetCounter(): void {
    UserFactory.counter = 1;
  }
}

// Helper functions for easier imports
export const createUser = (overrides?: Partial<UserEntity>) =>
  UserFactory.create(overrides);
export const createUserWithAssociation = (
  associationId: number,
  overrides?: Partial<UserEntity>,
) => UserFactory.createWithAssociation(associationId, overrides);
export const createManyUsers = (
  count: number,
  overrides?: Partial<UserEntity>,
) => UserFactory.createMany(count, overrides);

import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common';

/**
 * Cria um TestingModule do NestJS de forma simplificada
 * @param metadata - Metadados do módulo (controllers, providers, imports)
 */
export const createTestingModule = async (
  metadata: ModuleMetadata,
): Promise<TestingModule> => {
  const moduleBuilder = Test.createTestingModule(metadata);
  return await moduleBuilder.compile();
};

/**
 * Helper para criar um mock de repositório com métodos padrão
 * Útil para mockar IUserRepository, IAnimalRepository, etc.
 */
export const mockRepository = () => ({
  create: jest.fn(),
  findAllActive: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  partialUpdate: jest.fn(),
  softDelete: jest.fn(),
  delete: jest.fn(),
});

/**
 * Helper para criar um mock de service com métodos padrão CRUD
 */
export const mockCrudService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

/**
 * Helper para simular delay (útil para testes assíncronos)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Helper para gerar email único para testes
 */
export const generateTestEmail = (prefix: string = 'test'): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@test.com`;
};

/**
 * Helper para gerar CNPJ válido para testes
 */
export const generateTestCNPJ = (): string => {
  const randomDigits = () => Math.floor(Math.random() * 10);
  const cnpj = Array.from({ length: 14 }, randomDigits).join('');
  return cnpj;
};

/**
 * Helper para gerar CPF válido para testes
 */
export const generateTestCPF = (): string => {
  const randomDigits = () => Math.floor(Math.random() * 10);
  const cpf = Array.from({ length: 11 }, randomDigits).join('');
  return cpf;
};

/**
 * Helper para limpar todos os mocks de um objeto
 */
export const clearAllMocks = (mockObject: any): void => {
  Object.keys(mockObject).forEach((key) => {
    if (jest.isMockFunction(mockObject[key])) {
      (mockObject[key] as jest.Mock).mockClear();
    }
  });
};

/**
 * Helper para verificar se uma função foi chamada com argumentos parciais
 */
export const expectCalledWithPartial = <T>(
  mockFn: jest.Mock,
  partialArgs: Partial<T>,
): void => {
  expect(mockFn).toHaveBeenCalled();

  const calls = mockFn.mock.calls;
  const matchingCall = calls.find((call) => {
    const arg = call[0];
    return Object.keys(partialArgs).every(
      (key) => arg[key as keyof T] === partialArgs[key as keyof T],
    );
  });

  expect(matchingCall).toBeDefined();
};

/**
 * Helper para criar data no futuro
 */
export const futureDate = (daysFromNow: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

/**
 * Helper para criar data no passado
 */
export const pastDate = (daysAgo: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

/**
 * Helper para verificar se uma data está dentro de um intervalo
 */
export const isDateWithinRange = (
  date: Date,
  start: Date,
  end: Date,
): boolean => {
  return date >= start && date <= end;
};

/**
 * Helper para mockar bcrypt hash de forma síncrona
 */
export const mockBcryptHash = (password: string): string => {
  return `$2a$10$hashed_${password}`;
};

/**
 * Helper para mockar bcrypt compare
 */
export const mockBcryptCompare = (password: string, hash: string): boolean => {
  return hash === mockBcryptHash(password);
};

/**
 * Helper para criar um mock de Logger do NestJS
 */
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

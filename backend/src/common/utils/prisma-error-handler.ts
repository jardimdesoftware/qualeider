import { BusinessException } from '@/common/exceptions/business.exception';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';

/**
 * Códigos de erro do Prisma
 * @see https://www.prisma.io/docs/orm/reference/error-reference
 */
export enum PrismaErrorCode {
  UNIQUE_CONSTRAINT_VIOLATION = 'P2002',
  RECORD_NOT_FOUND = 'P2025',
  FOREIGN_KEY_CONSTRAINT_FAILED = 'P2003',
  CONSTRAINT_FAILED = 'P2004',
}

/**
 * Tipo de erro do Prisma
 */
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
    modelName?: string;
  };
}

/**
 * Verifica se o erro é um erro do Prisma
 */
export function isPrismaError(error: unknown): error is PrismaError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as PrismaError).code === 'string'
  );
}

/**
 * Trata erros do Prisma e os converte em exceções de negócio apropriadas
 * 
 * @param error Erro capturado
 * @param customMessages Mensagens customizadas por código de erro
 * @throws BusinessException ou EntityNotFoundException
 */
export function handlePrismaError(
  error: unknown,
  customMessages?: Partial<Record<PrismaErrorCode, string>>,
): never {
  if (!isPrismaError(error)) {
    throw error;
  }

  const { code, meta } = error;

  switch (code) {
    case PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION: {
      const field = meta?.target?.[0] || 'campo';
      const message =
        customMessages?.[PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION] ||
        `${field} já está em uso.`;
      throw new BusinessException(message);
    }

    case PrismaErrorCode.RECORD_NOT_FOUND: {
      const modelName = meta?.modelName || 'Registro';
      const message =
        customMessages?.[PrismaErrorCode.RECORD_NOT_FOUND] ||
        `${modelName} não encontrado.`;
      throw new EntityNotFoundException(message);
    }

    case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED: {
      const message =
        customMessages?.[PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED] ||
        'Referência inválida. Verifique os dados relacionados.';
      throw new BusinessException(message);
    }

    case PrismaErrorCode.CONSTRAINT_FAILED: {
      const message =
        customMessages?.[PrismaErrorCode.CONSTRAINT_FAILED] ||
        'Operação violou uma restrição do banco de dados.';
      throw new BusinessException(message);
    }

    default:
      throw error;
  }
}

/**
 * Helper específico para erros de constraint unique em email
 */
export function handleEmailUniqueError(error: unknown): never {
  handlePrismaError(error, {
    [PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Email já está em uso.',
  });
}

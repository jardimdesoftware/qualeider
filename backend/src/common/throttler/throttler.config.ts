import { ExecutionContext } from '@nestjs/common';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Configuração global do módulo de Throttler (Rate Limiting).
 *
 * Define o limite padrão por rota. Rotas específicas sobrescrevem com @Throttle()
 * (login, reset de senha, cadastro etc. têm limites bem mais baixos).
 *
 * O balde de cada requisição depende de quem a faz (ver AppThrottlerGuard):
 * - Usuário autenticado: um balde POR USUÁRIO, com limite maior — o frontend
 *   dispara várias chamadas por tela e refaz as consultas ao voltar para a aba.
 * - Visitante (rotas @Public): um balde por IP real do cliente, com limite baixo.
 *
 * Antes, tudo era por IP com limite 10/min. Atrás do nginx todos os usuários
 * chegam com o mesmo IP, então o balde era compartilhado pelo sistema inteiro:
 * o tráfego de um usuário bloqueava os outros (429) e as listas apareciam vazias.
 *
 * Configuração dinâmica baseada em ambiente:
 * - Em TESTE (NODE_ENV=test): TTL de 2 segundos e limite autenticado menor,
 *   para testes rápidos.
 * - Em PRODUÇÃO: TTL de 60 segundos.
 *
 * @see {@link https://docs.nestjs.com/security/rate-limiting} Documentação oficial
 */

const isTestEnv = (): boolean =>
  process.env.NODE_ENV === 'test' || process.env.TEST_THROTTLING === 'true';

// Helper para obter TTL baseado no ambiente (Retorna em MILISSEGUNDOS para Throttler v6)
const getTTL = (prodSeconds: number): number => {
  return isTestEnv() ? 2000 : prodSeconds * 1000;
};

// Exportar valores para uso em decorators personalizados
export const THROTTLE_TTL = {
  SHORT: getTTL(60),    // 60s em prod, 2s em test
  LONG: getTTL(300),    // 300s em prod, 2s em test
};

/** Limite padrão por rota dentro de uma janela SHORT. */
export const THROTTLE_LIMIT = {
  ANONYMOUS: 10,
  AUTHENTICATED: isTestEnv() ? 15 : 100,
};

const isAuthenticated = (context: ExecutionContext): boolean =>
  Boolean(context.switchToHttp().getRequest()?.user);

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    ttl: THROTTLE_TTL.SHORT,
    limit: (context: ExecutionContext) =>
      isAuthenticated(context)
        ? THROTTLE_LIMIT.AUTHENTICATED
        : THROTTLE_LIMIT.ANONYMOUS,
  },
];

import { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Configuração global do módulo de Throttler (Rate Limiting).
 * 
 * Define o limite padrão de requisições para todas as rotas da aplicação.
 * Rotas específicas podem sobrescrever esta configuração usando o decorator @Throttle().
 * 
 * Configuração dinâmica baseada em ambiente:
 * - Em TESTE (NODE_ENV=test): TTL de 2 segundos para testes rápidos
 * - Em PRODUÇÃO: TTL de 60 segundos 
 * 
 * Isso significa que, por padrão, cada usuário/IP pode fazer no máximo 10 requisições
 * a cada 60 segundos em qualquer rota que não tenha configuração personalizada.
 * 
 * @see {@link https://docs.nestjs.com/security/rate-limiting} Documentação oficial
 */

// Helper para obter TTL baseado no ambiente
const getTTL = (prodTTL: number): number => {
  return process.env.NODE_ENV === 'test' ? 2 : prodTTL;
};

// Exportar valores para uso em decorators personalizados
export const THROTTLE_TTL = {
  SHORT: getTTL(60),    // 60s em prod, 2s em test
  LONG: getTTL(300),    // 300s em prod, 2s em test
};

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    ttl: THROTTLE_TTL.SHORT,
    limit: 10, 
  },
];


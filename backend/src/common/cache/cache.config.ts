import { CacheModuleOptions } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

const DEFAULT_CACHE_TTL = 300000;

function buildRedisUrl(): string {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const database = process.env.REDIS_DB || '0';
  const password = process.env.REDIS_PASSWORD
    ? `:${encodeURIComponent(process.env.REDIS_PASSWORD)}@`
    : '';

  return `redis://${password}${host}:${port}/${database}`;
}

/**
 * Opções de configuração para o módulo de Cache do NestJS.
 * 
 * Esta configuração suporta dois modos:
 * - **Redis** (Produção): Cache persistente e compartilhado entre instâncias
 * - **In-Memory** (Desenvolvimento/Testes): Cache local sem dependências externas
 * 
 * A seleção é feita automaticamente:
 * - Se NODE_ENV=production E REDIS_HOST/REDIS_URL estiver configurado: usa Redis
 * - Caso contrário: usa in-memory cache padrão
 * 
 * Configurações:
 * - **isGlobal**: Módulo disponível globalmente
 * - **ttl**: 5 minutos (300000 ms) de vida padrão
 * 
 * @type {CacheModuleOptions}
 * @see {@link https://docs.nestjs.com/techniques/caching} Documentação oficial
 */
export const cacheConfig: CacheModuleOptions = {
  isGlobal: true,
  ttl: DEFAULT_CACHE_TTL,
  
  // Apenas usa Redis em produção (development e test usam in-memory)
  ...(process.env.NODE_ENV === 'production' && (process.env.REDIS_HOST || process.env.REDIS_URL)
    ? {
        stores: [new KeyvRedis(buildRedisUrl())],
      }
    : {}),
};

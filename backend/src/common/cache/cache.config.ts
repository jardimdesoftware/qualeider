import { CacheModuleOptions, CacheStore } from '@nestjs/cache-manager';

/**
 * Opções de configuração para o módulo de Cache do NestJS.
 * 
 * Esta configuração suporta dois modos:
 * - **Redis** (Produção): Cache persistente e compartilhado entre instâncias
 * - **In-Memory** (Desenvolvimento/Testes): Cache local sem dependências externas
 * 
 * A seleção é feita automaticamente:
 * - Se NODE_ENV=production E REDIS_HOST estiver configurado: usa Redis
 * - Caso contrário: usa in-memory cache padrão
 * 
 * Configurações:
 * - **isGlobal**: Módulo disponível globalmente
 * - **ttl**: 5 minutos (300000 ms) de vida padrão
 * - **max**: Máximo de 100 itens (in-memory)
 * 
 * @type {CacheModuleOptions}
 * @see {@link https://docs.nestjs.com/techniques/caching} Documentação oficial
 */
export const cacheConfig: CacheModuleOptions = {
  isGlobal: true,
  ttl: 300000, // cache-manager v5 usa milissegundos
  max: 100, // Máximo de itens no cache in-memory
  
  // Apenas usa Redis em produção (development e test usam in-memory)
  ...(process.env.NODE_ENV === 'production' && process.env.REDIS_HOST ? {
    store: async () => {
      const redisStore = await import('cache-manager-redis-yet');
      return redisStore.redisStore({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DB || '0'),
        ttl: 300000,
      }) as unknown as CacheStore;
    },
  } : {}),
};
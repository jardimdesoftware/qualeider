import { CacheModuleOptions } from '@nestjs/cache-manager';

/**
 * Opções de configuração para o módulo de Cache do NestJS.
 * 
 * Esta configuração suporta dois modos:
 * - **Redis** (Produção): Cache persistente e compartilhado entre instâncias
 * - **In-Memory** (Desenvolvimento): Cache local sem dependências externas
 * 
 * A seleção é feita automaticamente baseada na presença de REDIS_HOST:
 * - Se REDIS_HOST estiver configurado: usa Redis
 * - Caso contrário: usa in-memory cache
 * 
 * Configurações:
 * - **isGlobal**: Módulo disponível globalmente
 * - **ttl**: 5 minutos (300 segundos) de vida padrão
 * - **max**: Máximo de 100 itens (apenas in-memory)
 * 
 * @type {CacheModuleOptions}
 * @see {@link https://docs.nestjs.com/techniques/caching} Documentação oficial
 */
export const cacheConfig: CacheModuleOptions = {
  isGlobal: true,
  ttl: 300,
  
  // Configuração dinâmica: Redis se disponível, senão in-memory
  ...(process.env.REDIS_HOST ? {
    store: require('cache-manager-redis-yet'),
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  } : {
    max: 100, // Apenas para in-memory
  }),
};
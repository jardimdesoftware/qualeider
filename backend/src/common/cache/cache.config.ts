import { CacheModuleOptions } from '@nestjs/cache-manager';

const DEFAULT_CACHE_TTL = 300000;

// Cache em memória (por instância). Ver issue #171 — Redis foi removido por
// não haver justificativa de escala: o backend roda em instancia unica (sem
// replicas configuradas em nenhum docker-compose), entao o unico ganho real
// do Redis (compartilhar cache entre instancias) nao se aplica hoje.
export const cacheConfig: CacheModuleOptions = {
  isGlobal: true,
  ttl: DEFAULT_CACHE_TTL,
};

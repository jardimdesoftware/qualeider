import { CacheModuleOptions } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

const DEFAULT_CACHE_TTL = 300000;

export const cacheConfig: CacheModuleOptions = {
  isGlobal: true,
  ttl: DEFAULT_CACHE_TTL,
  ...(process.env.NODE_ENV === 'production' &&
  (process.env.REDIS_HOST || process.env.REDIS_URL)
    ? {
        stores: [createKeyv(buildRedisUrl())],
      }
    : {}),
};

function buildRedisUrl(): string {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const database = process.env.REDIS_DB || '0';
  const url = new URL(`redis://${host}:${port}/${database}`);

  if (process.env.REDIS_PASSWORD) {
    url.password = process.env.REDIS_PASSWORD;
  }

  return url.toString();
}

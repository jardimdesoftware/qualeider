import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MAX_TRUSTED_HOPS = 5;

/**
 * Quantos proxies à frente do backend podem ser confiados para informar o IP do
 * cliente (X-Forwarded-For). 0 = nenhum (padrão): o IP é o da conexão.
 *
 * Valor inválido cai em 0 de propósito: confiar em proxies a mais do que
 * existem deixaria o cliente forjar o próprio IP e escapar do rate limit.
 */
export function resolveTrustProxyHops(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return 0;

  const hops = Number(raw);
  return Number.isInteger(hops) && hops >= 0 && hops <= MAX_TRUSTED_HOPS
    ? hops
    : 0;
}

/**
 * Atrás do nginx do projeto (que sobrescreve o X-Forwarded-For com o IP real),
 * use TRUST_PROXY_HOPS=1: `req.ip` passa a ser o IP do cliente, e não o do
 * nginx — sem isso o rate limit por IP de rotas públicas (login etc.) vira um
 * balde único para todo mundo.
 */
export function configureTrustProxy(
  app: INestApplication,
  configService: ConfigService,
): number {
  const hops = resolveTrustProxyHops(
    configService.get<string>('TRUST_PROXY_HOPS'),
  );

  if (hops > 0) {
    app.getHttpAdapter().getInstance().set('trust proxy', hops);
  }
  return hops;
}

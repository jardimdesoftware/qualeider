import type { RequestHandler } from 'express';
import helmet from 'helmet';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEV_FRONTEND_ORIGIN = 'http://localhost:3000';

export interface CorsResult {
  options: CorsOptions;
  /** Avisos de configuração para o log de inicialização. */
  warnings: string[];
}

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

/**
 * CORS da API.
 *
 * Sem `credentials`: a autenticação é Bearer (header Authorization) e nenhum
 * fluxo depende de cookie cross-origin, então o navegador não precisa enviar
 * credenciais — e o header Access-Control-Allow-Credentials deixa de existir.
 *
 * Em produção o frontend chama a API pela mesma origem (/api via nginx), então
 * CORS nem é exercido; por isso o padrão em produção é não liberar origem
 * nenhuma, e curinga ("*"/"true") é ignorado com aviso.
 */
export function buildCorsOptions(
  rawOrigins: string | undefined,
  isProduction: boolean,
): CorsResult {
  const warnings: string[] = [];
  const methods = 'GET,POST,PUT,PATCH,DELETE';
  const maxAge = 600;

  const raw = rawOrigins?.trim();
  const wildcard = raw === '*' || raw?.toLowerCase() === 'true';

  if (wildcard) {
    if (isProduction) {
      warnings.push(
        'CORS_ORIGINS="*" ignorado em produção: nenhuma origem cross-origin foi liberada. Liste as origens explicitamente, se precisar.',
      );
      return { options: { origin: false, methods, maxAge }, warnings };
    }
    return { options: { origin: '*', methods, maxAge }, warnings };
  }

  const origins = (raw ? raw.split(',') : [])
    .map(normalizeOrigin)
    .filter(Boolean);

  // Facilita o desenvolvimento local; nunca em produção.
  if (!isProduction && !origins.includes(DEV_FRONTEND_ORIGIN)) {
    origins.push(DEV_FRONTEND_ORIGIN);
  }

  return {
    options: { origin: origins.length > 0 ? origins : false, methods, maxAge },
    warnings,
  };
}

/** Caminhos do Swagger UI e dos specs (ver SWAGGER_PATHS em main.ts). */
export function isSwaggerPath(path: string): boolean {
  return path.startsWith('/api-docs');
}

/**
 * Helmet com CSP por tipo de resposta. A API devolve JSON, que não precisa de
 * nenhum recurso: `default-src 'none'`. Só o Swagger UI (HTML) precisa de uma
 * política mais permissiva — e mesmo ele não usa 'unsafe-eval'.
 */
export function createHelmetMiddleware(): RequestHandler {
  const apiHelmet = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  });

  const swaggerHelmet = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        // Helmet inclui essa diretiva por padrão, o que faz o navegador tentar
        // recarregar todo asset do Swagger via HTTPS — quebrando a página em
        // qualquer ambiente que sirva HTTP puro (dev local e a stack de nginx
        // deste projeto, que não termina TLS).
        upgradeInsecureRequests: null,
      },
    },
  });

  return (req, res, next) =>
    isSwaggerPath(req.path) ? swaggerHelmet(req, res, next) : apiHelmet(req, res, next);
}

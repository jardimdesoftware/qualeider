/**
 * Content-Security-Policy do frontend, montada por requisição em src/proxy.ts
 * (precisa de um nonce novo a cada resposta).
 *
 * Origens externas permitidas (o navegador fala direto com elas):
 *  - Unsplash: imagem da landing page;
 *  - Sentry (se NEXT_PUBLIC_SENTRY_DSN estiver definido): envio de erros.
 *
 * Estilos em elementos ficam limitados a folhas da mesma origem e ao nonce.
 * `style-src-attr` mantém 'unsafe-inline' somente para atributos `style=`
 * gerados por React, react-hot-toast e recharts; isso evita liberar blocos
 * `<style>` inline genéricos. Scripts ficam só com nonce + 'strict-dynamic'.
 */
const EXTERNAL_IMG_SRC = ["https://images.unsplash.com"];

export interface CspOptions {
  nonce: string;
  isDev?: boolean;
  sentryDsn?: string;
}

function sentryOrigin(dsn?: string): string | null {
  if (!dsn) return null;
  try {
    return new URL(dsn).origin;
  } catch {
    return null;
  }
}

export function buildCsp({
  nonce,
  isDev = false,
  sentryDsn,
}: CspOptions): string {
  const sentry = sentryOrigin(sentryDsn);

  // Em desenvolvimento o React usa eval (stack traces) e o HMR usa websocket.
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (isDev) scriptSrc.push("'unsafe-eval'");

  const connectSrc = ["'self'"];
  if (sentry) connectSrc.push(sentry);
  if (isDev) connectSrc.push("ws:", "wss:");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", `'nonce-${nonce}'`],
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...EXTERNAL_IMG_SRC],
    "font-src": ["'self'", "data:"],
    "connect-src": connectSrc,
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

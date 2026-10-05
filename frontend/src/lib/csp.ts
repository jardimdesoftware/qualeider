/**
 * Content-Security-Policy do frontend, montada por requisição em src/proxy.ts
 * (precisa de um nonce novo a cada resposta).
 *
 * Origens externas permitidas (o navegador fala direto com elas):
 *  - ViaCEP e IBGE: preenchimento de endereço (services/cepService e
 *    ibgeService existem, mas nenhuma tela os usa hoje; ficam liberados para
 *    não quebrarem em silêncio quando forem ligados);
 *  - Unsplash: imagem da landing page;
 *  - Sentry (se NEXT_PUBLIC_SENTRY_DSN estiver definido): envio de erros.
 *
 * `style-src` mantém 'unsafe-inline' de propósito: bibliotecas de UI
 * (react-hot-toast, recharts) e atributos `style=` do React injetam estilos em
 * tempo de execução, e nonce não cobre atributos. Scripts, o vetor que
 * importa para XSS, ficam só com nonce + 'strict-dynamic'.
 */
const EXTERNAL_CONNECT_SRC = [
  "https://viacep.com.br",
  "https://servicodados.ibge.gov.br",
];

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

  const connectSrc = ["'self'", ...EXTERNAL_CONNECT_SRC];
  if (sentry) connectSrc.push(sentry);
  if (isDev) connectSrc.push("ws:", "wss:");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
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

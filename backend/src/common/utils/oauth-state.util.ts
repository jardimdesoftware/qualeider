import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export const GOOGLE_OAUTH_STATE_COOKIE = 'qualeider_oauth_state';
export const GOOGLE_OAUTH_STATE_COOKIE_PATH = '/api/auth/google';
export const GOOGLE_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

/** Valor aleatório, imprevisível e de uso único, enviado ao Google como `state`. */
export function generateOAuthState(): string {
  return randomBytes(32).toString('hex');
}

/**
 * SHA-256 (hex) do state. É isto que vai no cookie: o valor "cru" só existe na
 * URL do Google, então o cookie sozinho não revela o state.
 */
export function hashOAuthState(state: string): string {
  return createHash('sha256').update(state).digest('hex');
}

/** Lê um cookie do header `Cookie` cru, sem precisar do cookie-parser. */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;

    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * O `state` devolvido pelo Google só vale se o seu hash for igual ao que este
 * navegador recebeu no cookie ao iniciar o login. Sem isso, um atacante poderia
 * fazer a vítima concluir um login com o `code` da conta dele (login CSRF).
 */
export function isValidOAuthState(
  received: string | undefined,
  expectedHash: string | undefined,
): boolean {
  if (!received || !expectedHash) return false;

  const receivedBuffer = Buffer.from(hashOAuthState(received));
  const expectedBuffer = Buffer.from(expectedHash);
  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

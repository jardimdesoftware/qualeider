import { randomBytes, timingSafeEqual } from 'crypto';

export const GOOGLE_OAUTH_STATE_COOKIE = 'qualeider_oauth_state';
export const GOOGLE_OAUTH_STATE_COOKIE_PATH = '/api/auth/google';
export const GOOGLE_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

/** Valor aleatório, imprevisível e de uso único, enviado ao Google como `state`. */
export function generateOAuthState(): string {
  return randomBytes(32).toString('hex');
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
 * O `state` devolvido pelo Google só vale se for igual ao que este navegador
 * recebeu no cookie ao iniciar o login. Sem isso, um atacante poderia fazer a
 * vítima concluir um login com o `code` da conta dele (login CSRF).
 */
export function isValidOAuthState(
  received: string | undefined,
  expected: string | undefined,
): boolean {
  if (!received || !expected) return false;

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

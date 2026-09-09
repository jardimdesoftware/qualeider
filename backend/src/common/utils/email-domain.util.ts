/**
 * Domínio institucional do IFPE. Qualquer email terminado nele (inclui
 * subdomínios como discente.ifpe.edu.br, professor.ifpe.edu.br etc.) é
 * liberado automaticamente para login via Google — ver AuthService.loginWithGoogle.
 */
export const IFPE_EMAIL_DOMAIN = 'ifpe.edu.br';

/**
 * Compara pelo domínio depois do "@" (exato ou subdomínio, ex.:
 * discente.ifpe.edu.br), nunca por sufixo da string inteira — um simples
 * `email.endsWith('ifpe.edu.br')` deixaria passar domínios forjados como
 * "aluno@evilifpe.edu.br".
 */
export function isIfpeEmail(email: string): boolean {
  const domain = email.toLowerCase().trim().split('@')[1] ?? '';
  return domain === IFPE_EMAIL_DOMAIN || domain.endsWith(`.${IFPE_EMAIL_DOMAIN}`);
}

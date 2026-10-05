import { timingSafeEqual } from 'crypto';

/**
 * Compara dois segredos em tempo constante (não vaza, pelo tempo de resposta,
 * quantos caracteres iniciais coincidem). Tamanhos diferentes retornam false.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Número máximo de tentativas de envio de email antes de desistir e salvar na DLQ.
 */
export const MAX_RETRIES = 3;

/**
 * Tempo de espera em milissegundos entre as tentativas de envio de email.
 * 2000ms = 2 segundos.
 */
export const DELAY_MS = 2000;

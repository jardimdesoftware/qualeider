/**
 * Constantes de segurança para autenticação e criptografia
 *
 * Centraliza valores relacionados a bcrypt, tokens e timeouts de segurança
 * para facilitar manutenção e evitar "números mágicos" espalhados pelo código.
 */

/**
 * Número de rounds (iterações) do bcrypt para criação de usuários
 * 2^10 = 1.024 iterações (~100ms)
 *
 * Usado em: UsersService.create(), AssociationsService.create()
 */
export const BCRYPT_ROUNDS_USER_CREATION = 10;

/**
 * Número de rounds (iterações) do bcrypt para reset de senha
 * 2^12 = 4.096 iterações (~200ms)
 *
 * Usado em: AuthService.resetPassword()
 * Justificativa: Reset de senha é operação mais crítica (conta pode ter sido comprometida),
 * portanto usa mais iterações para maior segurança.
 */
export const BCRYPT_ROUNDS_RESET_PASSWORD = 12;

/**
 * Valor mínimo para geração de token de reset de senha (6 dígitos)
 * Range: 100000-999999
 */
export const RESET_TOKEN_MIN_VALUE = 100000;

/**
 * Valor máximo para geração de token de reset de senha (6 dígitos)
 * Range: 100000-999999
 */
export const RESET_TOKEN_MAX_VALUE = 900000;

/**
 * Tempo de expiração do token de reset de senha (em minutos)
 * Usado em: AuthService.forgotPassword(), AuthService.validateResetToken()
 */
export const RESET_TOKEN_EXPIRY_MINUTES = 15;

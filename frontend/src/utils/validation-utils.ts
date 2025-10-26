/**
 * Valida um email usando regex
 * @param email - Email a ser validado
 * @returns true se o email é válido, false caso contrário
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida se uma string não está vazia
 * @param value - Valor a ser validado
 * @returns true se não está vazio, false caso contrário
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Valida se uma senha atende aos requisitos mínimos
 * @param password - Senha a ser validada
 * @param minLength - Tamanho mínimo (padrão: 6)
 * @returns true se a senha é válida, false caso contrário
 */
export const isValidPassword = (
  password: string,
  minLength: number = 6
): boolean => {
  return password.length >= minLength;
};

/**
 * Valida se duas senhas coincidem
 * @param password - Senha original
 * @param confirmPassword - Confirmação da senha
 * @returns true se as senhas coincidem, false caso contrário
 */
export const passwordsMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

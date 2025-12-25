import * as z from "zod";

// ===========================
// 1. ÁTOMOS: Regras Isoladas Reutilizáveis
// ===========================

export const emailRule = z
  .string()
  .min(1, "Email é obrigatório")
  .email("Formato de email inválido");

export const passwordRule = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número")
  .regex(/[@$!%*?&]/, "A senha deve conter pelo menos um caractere especial (@$!%*?&)");

export const nameRule = z
  .string()
  .min(3, "Nome deve ter no mínimo 3 caracteres")
  .max(100, "Nome muito longo");

export const cpfRule = z
  .string()
  .min(1, "CPF é obrigatório")
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido (formato: 000.000.000-00)");

export const cnpjRule = z
  .string()
  .min(1, "CNPJ é obrigatório")
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido (formato: 00.000.000/0000-00)");

export const phoneRule = z
  .string()
  .min(1, "Telefone é obrigatório")
  .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone inválido (formato: (00) 00000-0000)");

export const codeRule = z
  .string()
  .length(6, "Código deve ter 6 dígitos")
  .regex(/^\d{6}$/, "Código deve conter apenas números");

// ===========================
// 2. SCHEMAS COMPOSTOS
// ===========================

export const loginSchema = z.object({
  email: emailRule,
  password: passwordRule,
});

export const registerSchema = z.object({
  name: nameRule,
  email: emailRule,
  password: passwordRule,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailRule,
});

export const resetPasswordSchema = z.object({
  email: emailRule,
  code: codeRule,
  password: passwordRule,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// Trocar senha (usuário logado)
export const changePasswordSchema = z.object({
  currentPassword: passwordRule,
  newPassword: passwordRule,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "A nova senha deve ser diferente da atual",
  path: ["newPassword"],
});

// ===========================
// 3. TYPES (Inferência Automática)
// ===========================

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

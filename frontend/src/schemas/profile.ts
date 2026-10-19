import * as z from "zod";
import { emailRule, nameRule } from "./auth";

const stateRule = z
  .string()
  .length(2, "Estado deve ser a sigla (UF) com 2 letras");
const cityRule = z
  .string()
  .min(1, "Cidade é obrigatória")
  .max(100, "Cidade muito longa");

// ===========================
// SETTINGS/PROFILE SCHEMA
// ===========================

export const settingsSchema = z.object({
  name: nameRule,
  email: emailRule,
  userCategory: z.enum(["Fisica", "Juridica"]),
  state: stateRule,
  city: cityRule,
  userType: z.string().optional(),
});

// ===========================
// TYPES
// ===========================

export type SettingsData = z.infer<typeof settingsSchema>;

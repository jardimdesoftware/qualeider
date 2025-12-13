import * as z from "zod";
import { emailRule, passwordRule, nameRule, cpfRule, cnpjRule, phoneRule } from "./auth";

// ===========================
// SCHEMAS DE LOCATION
// ===========================

export const stateRule = z.string().min(1, "Estado é obrigatório");
export const cityRule = z.string().min(1, "Cidade é obrigatória");

// ===========================
// PRODUCER SCHEMA
// ===========================

export const producerSchema = z.object({
  name: nameRule,
  email: emailRule,
  password: passwordRule,
  confirmPassword: z.string(),
  cpf: cpfRule,
  phone: phoneRule,
  
  state: stateRule,
  city: cityRule,
  
  userCategory: z.enum(["Fisica", "Juridica"]),
  
  userType: z.string().min(1, "Tipo de usuário é obrigatório"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// ===========================
// ASSOCIATION SCHEMA
// ===========================

export const associationSchema = z.object({
  name: nameRule,
  email: emailRule,
  password: passwordRule,
  confirmPassword: z.string(),
  
  cnpj: cnpjRule,
  phone: phoneRule,
  
  state: stateRule,
  city: cityRule,
  
  userCategory: z.enum(["Juridica"]),
  
  coverageArea: z.enum(["Municipal", "Regional", "Estadual"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// ===========================
// TYPES
// ===========================

export type ProducerData = z.infer<typeof producerSchema>;
export type AssociationData = z.infer<typeof associationSchema>;

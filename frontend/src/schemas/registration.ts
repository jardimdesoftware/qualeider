import * as z from "zod";
import { emailRule, passwordRule, nameRule, cpfRule, cnpjRule, phoneRule } from "./auth";

// ===========================
// SCHEMAS DE LOCATION
// ===========================

export const stateRule = z.string().min(1, "Estado é obrigatório");
export const cityRule = z.string().min(1, "Cidade é obrigatória");

// ===========================
// PRODUCER SCHEMA (Complete)
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
// PRODUCER MULTISTEP SCHEMAS
// ===========================

// Step 1: Dados Essenciais (Nome, Email, Senha)
export const producerStep1Schema = z.object({
  name: nameRule,
  email: emailRule,
  password: passwordRule,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// Step 2: Contato e Localização (CPF, Telefone, CEP, Estado, Cidade)
export const producerStep2Schema = z.object({
  cpf: cpfRule,
  phone: phoneRule,
  state: stateRule,
  city: cityRule,
});

// Step 3: Categorização (Tipo de Produtor)
export const producerStep3Schema = z.object({
  userCategory: z.enum(["Fisica", "Juridica"]),
  userType: z.string().min(1, "Tipo de usuário é obrigatório"),
});

// ===========================
// ASSOCIATION SCHEMA (Complete)
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
// ASSOCIATION MULTISTEP SCHEMAS
// ===========================

// Step 1: Dados Essenciais (Nome, Email, Senha)
export const associationStep1Schema = z.object({
  name: nameRule,
  email: emailRule,
  password: passwordRule,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// Step 2: Documentação e Contato (CNPJ, Telefone)
export const associationStep2Schema = z.object({
  cnpj: cnpjRule,
  phone: phoneRule,
});

// Step 3: Localização e Área de Cobertura
export const associationStep3Schema = z.object({
  state: stateRule,
  city: cityRule,
  userCategory: z.enum(["Juridica"]),
  coverageArea: z.enum(["Municipal", "Regional", "Estadual"]),
});

// ===========================
// TYPES
// ===========================

export type ProducerData = z.infer<typeof producerSchema>;
export type AssociationData = z.infer<typeof associationSchema>;

// Step types
export type ProducerStep1Data = z.infer<typeof producerStep1Schema>;
export type ProducerStep2Data = z.infer<typeof producerStep2Schema>;
export type ProducerStep3Data = z.infer<typeof producerStep3Schema>;

export type AssociationStep1Data = z.infer<typeof associationStep1Schema>;
export type AssociationStep2Data = z.infer<typeof associationStep2Schema>;
export type AssociationStep3Data = z.infer<typeof associationStep3Schema>;

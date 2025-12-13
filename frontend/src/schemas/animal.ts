import * as z from "zod";

// ===========================
// ANIMAL SCHEMA
// ===========================

export const animalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  animalType: z.enum(["Vaca", "Cabra", "Ovelha", "Bufala", "Outro"]),
  breed: z.string().min(1, "Raça é obrigatória"),
  age: z.number().min(1, "Idade deve ser no mínimo 1"),
  userId: z.number().optional(), // Set by the component
});

// ===========================
// TYPES
// ===========================

export type AnimalData = z.infer<typeof animalSchema>;

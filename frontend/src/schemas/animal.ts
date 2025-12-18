import * as z from "zod";
import { AnimalType } from "@/interfaces/animal";

// ===========================
// ANIMAL SCHEMA
// ===========================

export const animalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  animalType: z.nativeEnum(AnimalType),
  breed: z.string().min(1, "Raça é obrigatória"),
  age: z.number().min(1, "Idade deve ser no mínimo 1"),
});

// ===========================
// TYPES
// ===========================

export type AnimalData = z.infer<typeof animalSchema>;

import * as z from "zod";

export const animalSchema = z.object({
  tagNumber: z.string().max(20, "Máximo 20 caracteres").optional(),
  name: z.string().optional(),
  animalSpeciesId: z.number().int().positive("Selecione um tipo de animal"),
  breedId: z.number().int().positive("Selecione uma raça"),
  breed: z.string().optional(),
  age: z.number().min(0, "Idade não pode ser negativa").max(30, "Idade máxima é 30 anos"),
  motherId: z.number().int().positive().optional(),
  motherCode: z.string().max(20, "Máximo 20 caracteres").optional(),
  fatherId: z.number().int().positive().optional(),
  fatherCode: z.string().max(50, "Máximo 50 caracteres").optional(),
});

export type AnimalData = z.infer<typeof animalSchema>;

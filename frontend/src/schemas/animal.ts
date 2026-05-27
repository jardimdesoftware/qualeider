import * as z from "zod";

export const animalSchema = z.object({
  name: z.string().optional(),
  animalSpeciesId: z.number().int().positive("Selecione um tipo de animal"),
  breedId: z.number().int().positive("Selecione uma raça"),
  breed: z.string().optional(),
  age: z.number().min(0, "Idade não pode ser negativa").max(30, "Idade máxima é 30 anos"),
});

export type AnimalData = z.infer<typeof animalSchema>;

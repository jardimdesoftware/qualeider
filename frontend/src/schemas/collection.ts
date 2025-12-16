import * as z from "zod";

// ===========================
// DAILY COLLECTION SCHEMA
// ===========================

export const dailyCollectionSchema = z.object({
  collectionDate: z.string().min(1, "Data é obrigatória"),
  quantity: z.number().min(0, "Quantidade deve ser maior ou igual a zero"),
  numAnimals: z.number().min(0, "Número de animais deve ser preenchido"),
  numOrdens: z.number().min(0, "Número de ordenhas deve ser preenchido"),
  rationProvided: z.boolean(),
  numLactation: z.number().min(0, "Número de lactações deve ser preenchido"),
  milkingPlace: z.enum(["Aberto", "Curral", "Ambos"]),
  technicalAssistance: z.boolean(),
  userId: z.number().optional(),
  items: z.array(z.object({
    animalId: z.number(),
    quantity: z.number().min(0),
  })).optional(),
});

// ===========================
// TYPES
// ===========================

export type DailyCollectionData = z.infer<typeof dailyCollectionSchema>;

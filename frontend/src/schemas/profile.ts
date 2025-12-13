import * as z from "zod";
import { emailRule, nameRule } from "./auth";
import { stateRule, cityRule } from "./registration";

// ===========================
// SETTINGS/PROFILE SCHEMA
// ===========================

export const settingsSchema = z.object({
  name: nameRule,
  email: emailRule,
  userCategory: z.enum(["Fisica", "Juridica"]),
  state: stateRule,
  city: cityRule,
  userType: z.string().optional(), // Only for "user" type, not "association"
});

// ===========================
// TYPES
// ===========================

export type SettingsData = z.infer<typeof settingsSchema>;

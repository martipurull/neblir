import { healthSchema } from "@/app/lib/types/character";
import { z } from "zod";

export const healthUpdateSchema = healthSchema
  .pick({
    currentPhysicalHealth: true,
    currentMentalHealth: true,
    seriousPhysicalInjuries: true,
    seriousTrauma: true,
    deathSaves: true,
    madnessSaves: true,
    status: true,
  })
  .partial()
  .extend({
    physicalHitsAtZero: z.number().int().min(1).max(3).optional(),
    mentalHitsAtZero: z.number().int().min(1).max(3).optional(),
  });

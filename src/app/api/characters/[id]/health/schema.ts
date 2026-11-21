import { z } from "zod";
import { partialWithoutDefaults } from "@/app/lib/partialWithoutDefaults";
import { healthSchema } from "@/app/lib/types/character";

export const healthUpdateSchema = partialWithoutDefaults(
  healthSchema.pick({
    currentPhysicalHealth: true,
    currentMentalHealth: true,
    seriousPhysicalInjuries: true,
    seriousTrauma: true,
    deathSaves: true,
    madnessSaves: true,
    status: true,
  })
).extend({
  physicalHitsAtZero: z.number().int().min(1).max(3).optional(),
  mentalHitsAtZero: z.number().int().min(1).max(3).optional(),
});

import { healthSchema } from "@/app/lib/types/character";
import { z } from "zod";

export const healthUpdateSchema = healthSchema
  .pick({
    currentPhysicalHealth: true,
    currentMentalHealth: true,
    seriousPhysicalInjuries: true,
    seriousTrauma: true,
    deathSaves: true,
    status: true,
  })
  .partial();

export type HealthUpdateBody = z.infer<typeof healthUpdateSchema>;

import { healthSchema } from "@/app/lib/types/character";

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

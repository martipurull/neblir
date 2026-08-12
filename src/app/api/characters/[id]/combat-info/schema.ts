import { combatInformationSchema } from "@/app/lib/types/character";
import { z } from "zod";

export const combatInformationUpdateRequestSchema = combatInformationSchema
  .pick({
    armourMod: true,
    armourCurrentHP: true,
  })
  .extend({
    reactionsRemaining: z.number().int().nonnegative().optional(),
  })
  .partial();

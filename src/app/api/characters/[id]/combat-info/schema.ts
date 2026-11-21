import { z } from "zod";
import { partialWithoutDefaults } from "@/app/lib/partialWithoutDefaults";
import { combatInformationSchema } from "@/app/lib/types/character";

export const combatInformationUpdateRequestSchema = partialWithoutDefaults(
  combatInformationSchema
    .pick({
      armourMod: true,
      armourCurrentHP: true,
    })
    .extend({
      reactionsRemaining: z.number().int().nonnegative().optional(),
    })
);

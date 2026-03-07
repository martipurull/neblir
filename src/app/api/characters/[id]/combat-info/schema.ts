import { combatInformationSchema } from "@/app/lib/types/character";
import type { z } from "zod";

export const combatInformationUpdateRequestSchema = combatInformationSchema
  .pick({
    armourMod: true,
    armourCurrentHP: true,
    GridMod: true,
  })
  .partial();

export const combatInformationUpdateSchema = combatInformationSchema
  .pick({
    armourMod: true,
    armourMaxHP: true,
    armourCurrentHP: true,
    GridMod: true,
  })
  .partial();

export type CombatInformationUpdate = z.infer<
  typeof combatInformationUpdateSchema
>;

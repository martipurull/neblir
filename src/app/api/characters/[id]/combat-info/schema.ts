import { combatInformationSchema } from "@/app/lib/types/character";
import { z } from "zod";

export const combatInformationUpdateRequestSchema = combatInformationSchema
  .pick({
    armourMod: true,
    armourCurrentHP: true,
    GridMod: true,
  })
  .partial();

const combatInformationUpdateSchema = combatInformationSchema
  .pick({
    armourMod: true,
    armourMaxHP: true,
    armourCurrentHP: true,
    GridMod: true,
    rangeDefenceMod: true,
    meleeDefenceMod: true,
    GridDefenceMod: true,
    GridAttackMod: true,
  })
  .partial();

export type CombatInformationUpdate = z.infer<
  typeof combatInformationUpdateSchema
>;

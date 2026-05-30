import { combatInformationSchema } from "@/app/lib/types/character";

export const combatInformationUpdateRequestSchema = combatInformationSchema
  .pick({
    armourMod: true,
    armourCurrentHP: true,
  })
  .partial();

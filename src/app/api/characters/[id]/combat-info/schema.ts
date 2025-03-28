import { combatInformationSchema } from "@/app/lib/types/character";

export const combatInformationUpdateSchema = combatInformationSchema.pick({
    armourMod: true,
    armourMaxHP: true,
    armourCurrentHP: true,
    GridMod: true,
    rangeDefenceMod: true,
    meleeDefenceMod: true,
    GridDefenceMod: true,
})
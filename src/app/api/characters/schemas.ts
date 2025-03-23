import { combatInformationSchema, generalInformationSchema, generalSkillsSchema, healthSchema, innateAttributesSchema } from "@/app/lib/types/character";
import { z } from "zod";

export const characterCreationRequestSchema = z.object({
    generalInformation: generalInformationSchema,
    health: healthSchema.omit({
        innatePhysicalHealth: true,
        maxPhysicalHealth: true,
        innateMentalHealth: true,
        maxMentalHealth: true,
        currentPhysicalHealth: true,
        currentMentalHealth: true
    }),
    combatInformation: combatInformationSchema.omit({
        initiativeModifier: true,
        speed: true,
        rangeAttackMod: true,
        meleeAttackMod: true,
        GridAttackMod: true,
        rangeDefenceMod: true,
        meleeDefenceMod: true,
        GridDefenceMod: true,
    }),
    innateAttributes: innateAttributesSchema,
    learnedSkills: z.object({
        generalSkills: generalSkillsSchema,
        specialSkills: z.array(z.string()).max(3).optional(),
    }).refine((data) => {
        const specialSkillsSum = data.specialSkills?.length ?? 0
        const generalSkillsSum = Object.values(data.generalSkills).reduce((acc, val) => acc + val, 0)
        return (generalSkillsSum + specialSkillsSum) <= 15
    }),
})
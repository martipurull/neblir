import { combatInformationSchema, generalInformationSchema, generalSkillsSchema, healthSchema, innateAttributesSchema, itemCharacterSchema } from "@/app/lib/types/character";
import { walletSchema } from "@/app/lib/types/item";
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
        initiativeMod: true,
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
    }),
    wallet: walletSchema.optional(),
    equipment: z.array(itemCharacterSchema).optional(),
})

export type CharacterCreationRequest = z.infer<typeof characterCreationRequestSchema>

export const characterUpdateRequestSchema = characterCreationRequestSchema.extend({
    health: healthSchema.omit({
        innatePhysicalHealth: true,
        maxPhysicalHealth: true,
        innateMentalHealth: true,
        maxMentalHealth: true,
    })
}).partial().strict()

export type CharacterUpdateRequest = z.infer<typeof characterUpdateRequestSchema>
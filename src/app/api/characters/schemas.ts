import {
  combatInformationSchema,
  generalInformationSchema,
  generalSkillsSchema,
  healthSchema,
  innateAttributesSchema,
} from "@/app/lib/types/character";
import { walletSchema } from "@/app/lib/types/item";
import { z } from "zod";

export const characterCreationRequestSchema = z
  .object({
    generalInformation: generalInformationSchema.strict(),
    health: healthSchema
      .omit({
        innatePhysicalHealth: true,
        maxPhysicalHealth: true,
        innateMentalHealth: true,
        maxMentalHealth: true,
        currentPhysicalHealth: true,
        currentMentalHealth: true,
      })
      .strict(),
    combatInformation: combatInformationSchema
      .omit({
        initiativeMod: true,
        speed: true,
        reactionsPerRound: true,
        rangeAttackMod: true,
        meleeAttackMod: true,
        GridAttackMod: true,
        rangeDefenceMod: true,
        meleeDefenceMod: true,
        GridDefenceMod: true,
      })
      .strict(),
    innateAttributes: innateAttributesSchema.strict(),
    learnedSkills: z
      .object({
        generalSkills: generalSkillsSchema.strict(),
        specialSkills: z.array(z.string()).max(3).optional(),
      })
      .strict(),
    wallet: walletSchema.optional(),
  })
  .strict();

export type CharacterCreationRequest = z.infer<
  typeof characterCreationRequestSchema
>;

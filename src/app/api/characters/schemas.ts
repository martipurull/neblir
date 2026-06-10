import {
  combatInformationSchema,
  generalInformationSchema,
  generalSkillsSchema,
  healthSchema,
  innateAttributesSchema,
} from "@/app/lib/types/character";
import { walletSchema } from "@/app/lib/types/item";
import { specialAbilityNameSchemaValues } from "@/app/lib/specialAbility";
import { z } from "zod";

const characterCreationGeneralInformationSchema = generalInformationSchema
  .omit({ specialAbility: true })
  .extend({
    name: z.string().trim().min(1, "Name is required"),
    specialAbilityName: z.enum(specialAbilityNameSchemaValues).optional(),
  })
  .strict();

export const characterCreationRequestSchema = z
  .object({
    generalInformation: characterCreationGeneralInformationSchema,
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
        rangeDefenceMod: true,
        meleeDefenceMod: true,
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
    /**
     * Optional initial feature grades used to create FeatureCharacter relations.
     * This key is not part of the persisted character schema, so it should be
     * stripped before Prisma create.
     */
    initialFeatures: z
      .array(
        z.object({
          featureId: z.string(),
          grade: z.number().int().min(1),
        })
      )
      .optional(),
    path: z.strictObject({
      pathId: z.string().trim().min(1, "Please select a path"),
      rank: z.number().min(1),
    }),
    /** When set, links the new character to this game in the same transaction. */
    gameId: z.string().min(1).optional(),
    /** Links the new character to these games (dashboard create flow). */
    gameLinks: z
      .array(
        z.strictObject({
          gameId: z.string().min(1),
          isPublic: z.boolean(),
        })
      )
      .optional(),
    /** GM-only visibility for `gameId`; non-GMs are forced public. Defaults to false when omitted. */
    gameLinkIsPublic: z.boolean().optional(),
  })
  .strict();

export type CharacterCreationRequest = z.infer<
  typeof characterCreationRequestSchema
>;

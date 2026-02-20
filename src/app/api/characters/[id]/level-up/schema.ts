import { z } from "zod";
import { characterCreationRequestSchema } from "../../schemas";
import { characterSchema } from "@/app/lib/types/character";

const attributePropertyNames = [
  "intelligence.investigation",
  "intelligence.memory",
  "intelligence.deduction",
  "wisdom.sense",
  "wisdom.perception",
  "wisdom.insight",
  "personality.persuasion",
  "personality.deception",
  "personality.mentality",
  "strength.athletics",
  "strength.resilience",
  "strength.bruteForce",
  "dexterity.manual",
  "dexterity.stealth",
  "dexterity.agility",
  "constitution.resistanceInternal",
  "constitution.resistanceExternal",
  "constitution.stamina",
] as const;

const attributePropertyEnum = z.enum(attributePropertyNames);

const generalSkillNames = [
  "mechanics",
  "software",
  "generalKnowledge",
  "history",
  "driving",
  "acrobatics",
  "aim",
  "melee",
  "GRID",
  "research",
  "medicine",
  "science",
  "survival",
  "streetwise",
  "performance",
  "manipulationNegotiation",
] as const;

const generalSkillEnum = z.enum(generalSkillNames);

const attributeChangeSchema = z.object({
  from: attributePropertyEnum,
  to: attributePropertyEnum,
});

export const healthUpdateSchema = z
  .object({
    rolledPhysicalHealth: z.number(), // New value for rolled physical health
    rolledMentalHealth: z.number(), // New value for rolled mental health
  })
  .refine(
    (data) => {
      if (data.rolledPhysicalHealth <= 0 || data.rolledPhysicalHealth > 10) {
        return false;
      }
      if (data.rolledMentalHealth <= 0 || data.rolledMentalHealth > 10) {
        return false;
      }
      return true;
    },
    {
      message: "Rolled health must be between 1 and 10.",
    }
  );

export const levelUpRequestSchema = z
  .object({
    healthUpdate: healthUpdateSchema,
    pathId: z.string(),
    newFeatureIds: z.array(z.string()),
    incrementalFeatureIds: z.array(z.string()),
    skillImprovement: generalSkillEnum,
    attributeChanges: z.array(attributeChangeSchema).max(1).optional(),
  })
  .strict();

export type LevelUpRequest = z.infer<typeof levelUpRequestSchema>;

export const levelUpCharacterBodySchema = characterSchema
  .omit({
    wallet: true,
    inventory: true,
    notes: true,
    paths: true,
    features: true,
    games: true,
  })
  .strict();

export type LevelUpCharacterBody = z.infer<typeof levelUpCharacterBodySchema>;

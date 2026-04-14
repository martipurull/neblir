import { ItemAttributePath, ItemGeneralSkill } from "@prisma/client";
import { z } from "zod";
import type {
  LevelUpAttributePath,
  LevelUpGeneralSkill,
} from "@/app/lib/levelUpPaths";

/** Maps API / level-up attribute paths to Prisma enum (Mongo stores @map string). */
export const ATTRIBUTE_PATH_API_TO_PRISMA = {
  "intelligence.investigation": ItemAttributePath.INTELLIGENCE_INVESTIGATION,
  "intelligence.memory": ItemAttributePath.INTELLIGENCE_MEMORY,
  "intelligence.deduction": ItemAttributePath.INTELLIGENCE_DEDUCTION,
  "wisdom.sense": ItemAttributePath.WISDOM_SENSE,
  "wisdom.perception": ItemAttributePath.WISDOM_PERCEPTION,
  "wisdom.insight": ItemAttributePath.WISDOM_INSIGHT,
  "personality.persuasion": ItemAttributePath.PERSONALITY_PERSUASION,
  "personality.deception": ItemAttributePath.PERSONALITY_DECEPTION,
  "personality.mentality": ItemAttributePath.PERSONALITY_MENTALITY,
  "strength.athletics": ItemAttributePath.STRENGTH_ATHLETICS,
  "strength.resilience": ItemAttributePath.STRENGTH_RESILIENCE,
  "strength.bruteForce": ItemAttributePath.STRENGTH_BRUTE_FORCE,
  "dexterity.manual": ItemAttributePath.DEXTERITY_MANUAL,
  "dexterity.stealth": ItemAttributePath.DEXTERITY_STEALTH,
  "dexterity.agility": ItemAttributePath.DEXTERITY_AGILITY,
  "constitution.resistanceInternal":
    ItemAttributePath.CONSTITUTION_RESISTANCE_INTERNAL,
  "constitution.resistanceExternal":
    ItemAttributePath.CONSTITUTION_RESISTANCE_EXTERNAL,
  "constitution.stamina": ItemAttributePath.CONSTITUTION_STAMINA,
} as const satisfies Record<LevelUpAttributePath, ItemAttributePath>;

/** Maps API / level-up general skills to Prisma enum. */
export const GENERAL_SKILL_API_TO_PRISMA = {
  mechanics: ItemGeneralSkill.MECHANICS,
  software: ItemGeneralSkill.SOFTWARE,
  generalKnowledge: ItemGeneralSkill.GENERAL_KNOWLEDGE,
  history: ItemGeneralSkill.HISTORY,
  driving: ItemGeneralSkill.DRIVING,
  acrobatics: ItemGeneralSkill.ACROBATICS,
  aim: ItemGeneralSkill.AIM,
  melee: ItemGeneralSkill.MELEE,
  GRID: ItemGeneralSkill.GRID,
  research: ItemGeneralSkill.RESEARCH,
  medicine: ItemGeneralSkill.MEDICINE,
  science: ItemGeneralSkill.SCIENCE,
  survival: ItemGeneralSkill.SURVIVAL,
  streetwise: ItemGeneralSkill.STREETWISE,
  performance: ItemGeneralSkill.PERFORMANCE,
  manipulationNegotiation: ItemGeneralSkill.MANIPULATION_NEGOTIATION,
} as const satisfies Record<LevelUpGeneralSkill, ItemGeneralSkill>;

const attributePathKeys = Object.keys(
  ATTRIBUTE_PATH_API_TO_PRISMA
) as LevelUpAttributePath[];

const generalSkillKeys = Object.keys(
  GENERAL_SKILL_API_TO_PRISMA
) as LevelUpGeneralSkill[];

export const itemAttributePathSchema = z.enum(
  attributePathKeys as [LevelUpAttributePath, ...LevelUpAttributePath[]]
);

export const itemGeneralSkillSchema = z.enum(
  generalSkillKeys as [LevelUpGeneralSkill, ...LevelUpGeneralSkill[]]
);

export const PRISMA_TO_ATTRIBUTE_PATH_API = Object.fromEntries(
  Object.entries(ATTRIBUTE_PATH_API_TO_PRISMA).map(([api, prisma]) => [
    prisma,
    api,
  ])
) as Record<ItemAttributePath, LevelUpAttributePath>;

export const PRISMA_TO_GENERAL_SKILL_API = Object.fromEntries(
  Object.entries(GENERAL_SKILL_API_TO_PRISMA).map(([api, prisma]) => [
    prisma,
    api,
  ])
) as Record<ItemGeneralSkill, LevelUpGeneralSkill>;

/** BSON / raw Mongo value for an attribute path (Prisma @map equals API path). */
export function itemAttributePathToDbValue(path: LevelUpAttributePath): string {
  return path;
}

/** BSON / raw Mongo value for a general skill (Prisma @map equals API key). */
export function itemGeneralSkillToDbValue(skill: LevelUpGeneralSkill): string {
  return skill;
}

export function prismaItemAttributePathToDbValue(v: ItemAttributePath): string {
  return PRISMA_TO_ATTRIBUTE_PATH_API[v];
}

export function prismaItemGeneralSkillToDbValue(v: ItemGeneralSkill): string {
  return PRISMA_TO_GENERAL_SKILL_API[v];
}

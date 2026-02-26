import { z } from "zod";
import { featureSchema, pathSchema } from "./path";
import {
  itemSourceTypeSchema,
  walletSchema,
  weaponAttackRollTypeSchema,
  weaponDamageTypeSchema,
} from "./item";
import { gameCharacterSchema } from "./game";
import { Race, Religion, Status } from "@prisma/client";

/** Schema for a resolved item (Item, CustomItem, or merged UniqueItem) - used in inventory response */
const resolvedItemSchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    type: z.enum(["GENERAL_ITEM", "WEAPON"]),
    description: z.string().optional().nullable(),
    weight: z.number().optional().nullable(),
    usage: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    imageKey: z.string().optional().nullable(),
    confCost: z.number().optional(),
    costInfo: z.string().optional().nullable(),
    attackRoll: z.array(weaponAttackRollTypeSchema).optional(),
    attackBonus: z.number().optional().nullable(),
    damage: z
      .object({
        damageType: weaponDamageTypeSchema,
        diceType: z.number(),
        numberOfDice: z.number(),
        primaryRadius: z.number().optional().nullable(),
        secondaryRadius: z.number().optional().nullable(),
        areaEffect: z
          .object({
            defenceReactionCost: z.number(),
            defenceRoll: z.string(),
            successfulDefenceResult: z.string(),
          })
          .optional()
          .nullable(),
      })
      .optional()
      .nullable(),
    specialTag: z.string().optional().nullable(),
    _resolvedFrom: z.literal("UNIQUE_ITEM").optional(),
    _uniqueItemId: z.string().optional(),
  })
  .passthrough();

export const itemCharacterSchema = z.object({
  id: z.string(),
  characterId: z.string(),
  sourceType: itemSourceTypeSchema,
  itemId: z.string(),
  quantity: z.number(),
  currentAmmo: z.number().optional().nullable(),
  currentCharges: z.number().optional().nullable(),
  isEquipped: z.boolean(),
  customName: z.string().optional().nullable(),
  item: resolvedItemSchema.nullable(),
});

export const inventorySchema = z.array(itemCharacterSchema);

export const generalInformationSchema = z.object({
  name: z.string(),
  surname: z.string(),
  age: z.number(),
  religion: z.nativeEnum(Religion),
  profession: z.string(),
  race: z.nativeEnum(Race),
  birthplace: z.string(),
  level: z.number(),
  avatarKey: z.string().optional().nullable(),
  height: z.number().int(),
  weight: z.number().int(),
});

export const healthSchema = z.object({
  innatePhysicalHealth: z.number(), // Needs to be computed
  rolledPhysicalHealth: z.number().default(10),
  maxPhysicalHealth: z.number(), // Needs to be computed
  currentPhysicalHealth: z.number(), // Needs to be computed
  seriousPhysicalInjuries: z.number().max(3).default(0),
  innateMentalHealth: z.number(), // Needs to be computed
  rolledMentalHealth: z.number().default(10),
  maxMentalHealth: z.number(), // Needs to be computed
  currentMentalHealth: z.number(), // Needs to be computed
  seriousTrauma: z.number().max(3).default(0),
  deathSaves: z
    .object({
      successes: z.number().max(3).default(0),
      failures: z.number().max(3).default(0),
    })
    .optional(),
  status: z.nativeEnum(Status).default("ALIVE"),
});

export const combatInformationSchema = z.object({
  initiativeMod: z.number(), // Needs to be computed
  speed: z.number(), // Needs to be computed
  reactionsPerRound: z.number(), // Needs to be computed
  armourMod: z.number().default(0),
  armourMaxHP: z.number().default(0),
  armourCurrentHP: z.number().default(0),
  GridMod: z.number().default(0),
  rangeAttackMod: z.number(), // Needs to be computed
  meleeAttackMod: z.number(), // Needs to be computed
  GridAttackMod: z.number(), // Needs to be computed
  rangeDefenceMod: z.number(), // Needs to be computed
  meleeDefenceMod: z.number(), // Needs to be computed
  GridDefenceMod: z.number(), // Needs to be computed
});

const intelligenceSchema = z.object({
  investigation: z.number().min(1).max(5),
  memory: z.number().min(1).max(5),
  deduction: z.number().min(1).max(5),
});

const wisdomSchema = z.object({
  sense: z.number().min(1).max(5),
  perception: z.number().min(1).max(5),
  insight: z.number().min(1).max(5),
});

const personalitySchema = z.object({
  persuasion: z.number().min(1).max(5),
  deception: z.number().min(1).max(5),
  mentality: z.number().min(1).max(5),
});

const strengthSchema = z.object({
  athletics: z.number().min(1).max(5),
  resilience: z.number().min(1).max(5),
  bruteForce: z.number().min(1).max(5),
});

const dexteritySchema = z.object({
  manual: z.number().min(1).max(5),
  stealth: z.number().min(1).max(5),
  agility: z.number().min(1).max(5),
});

const constitutionSchema = z.object({
  resistanceInternal: z.number().min(1).max(5),
  resistanceExternal: z.number().min(1).max(5),
  stamina: z.number().min(1).max(5),
});

export const innateAttributesSchema = z.object({
  intelligence: intelligenceSchema,
  wisdom: wisdomSchema,
  personality: personalitySchema,
  strength: strengthSchema,
  dexterity: dexteritySchema,
  constitution: constitutionSchema,
});

export const generalSkillsSchema = z.object({
  mechanics: z.number().max(5).default(0),
  software: z.number().max(5).default(0),
  generalKnowledge: z.number().max(5).default(0),
  history: z.number().max(5).default(0),
  driving: z.number().max(5).default(0),
  acrobatics: z.number().max(5).default(0),
  aim: z.number().max(5).default(0),
  melee: z.number().max(5).default(0),
  GRID: z.number().max(5).default(0),
  research: z.number().max(5).default(0),
  medicine: z.number().max(5).default(0),
  science: z.number().max(5).default(0),
  survival: z.number().max(5).default(0),
  streetwise: z.number().max(5).default(0),
  performance: z.number().max(5).default(0),
  manipulationNegotiation: z.number().max(5).default(0),
});

export const characterNotesSchema = z.array(z.string());

export const characterSchema = z.object({
  generalInformation: generalInformationSchema,
  health: healthSchema,
  combatInformation: combatInformationSchema,
  innateAttributes: innateAttributesSchema,
  learnedSkills: z.object({
    generalSkills: generalSkillsSchema,
    specialSkills: z.array(z.string()).max(3).optional(),
  }),
  wallet: z.lazy(() => walletSchema).optional(),
  inventory: z.array(z.lazy(() => itemCharacterSchema)).optional(),
  notes: characterNotesSchema.optional(),
  paths: z.array(z.lazy(() => pathSchema)).optional(),
  features: z.array(z.lazy(() => featureSchema)).optional(),
  games: z.array(z.lazy(() => gameCharacterSchema)).optional(),
});

export type Character = z.infer<typeof characterSchema>;

export const characterListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  surname: z.string(),
  level: z.number(),
  paths: z.array(z.string()),
  avatarKey: z.string().nullable().optional(),
});

export const characterListSchema = z.array(characterListItemSchema);

export type CharacterListItem = z.infer<typeof characterListItemSchema>;

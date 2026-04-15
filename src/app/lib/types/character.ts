import { z } from "zod";
import { featureSchema, pathSchema } from "./path";
import {
  itemAttributePathSchema,
  itemGeneralSkillSchema,
} from "@/app/lib/itemModifierEnums";
import {
  equipSlotCostSchema,
  equipSlotTypeSchema,
  itemAreaTypeSchema,
  itemSourceTypeSchema,
  itemStatusSchema,
  walletSchema,
  weaponAttackRollTypeSchema,
  weaponDamageTypeSchema,
} from "./item";
import { gameCharacterWithGameSchema } from "./game";
import { Race, Religion, Status } from "@prisma/client";

/** Schema for a resolved item (Item, CustomItem, or merged UniqueItem) - used in inventory response */
const resolvedItemSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional().nullable(),
    type: z.enum(["GENERAL_ITEM", "WEAPON"]).optional().nullable(),
    description: z.string().optional().nullable(),
    weight: z.number().optional().nullable(),
    usage: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    imageKey: z.string().optional().nullable(),
    confCost: z.number().optional().nullable(),
    costInfo: z.string().optional().nullable(),
    attackRoll: z.array(weaponAttackRollTypeSchema).optional(),
    attackMeleeBonus: z.number().optional().nullable(),
    attackRangeBonus: z.number().optional().nullable(),
    attackThrowBonus: z.number().optional().nullable(),
    defenceMeleeBonus: z.number().optional().nullable(),
    defenceRangeBonus: z.number().optional().nullable(),
    gridAttackBonus: z.number().optional().nullable(),
    gridDefenceBonus: z.number().optional().nullable(),
    effectiveRange: z.number().optional().nullable(),
    maxRange: z.number().optional().nullable(),
    damage: z
      .object({
        damageType: z.array(weaponDamageTypeSchema),
        diceType: z.number(),
        numberOfDice: z.number(),
        areaType: itemAreaTypeSchema.optional().nullable(),
        coneLength: z.number().optional().nullable(),
        primaryRadius: z.number().optional().nullable(),
        secondaryRadius: z.number().optional().nullable(),
        areaEffect: z
          .object({
            defenceReactionCost: z.number(),
            defenceRoll: z.string(),
            successfulDefenceResult: z.string(),
          })
          .nullish(),
      })
      .optional()
      .nullable(),
    specialTag: z.string().optional().nullable(),
    equippable: z.boolean().optional().nullable(),
    equipSlotTypes: z.array(equipSlotTypeSchema).optional().nullable(),
    equipSlotCost: equipSlotCostSchema.optional().nullable(),
    modifiesAttribute: itemAttributePathSchema.optional().nullable(),
    attributeMod: z.number().int().optional().nullable(),
    modifiesSkill: itemGeneralSkillSchema.optional().nullable(),
    skillMod: z.number().int().optional().nullable(),
    isSpeedAltered: z.boolean().optional().nullable(),
    _resolvedFrom: z.literal("UNIQUE_ITEM").optional(),
    _uniqueItemId: z.string().nullish(),
  })
  .passthrough();

export const equipSlotSchema = z.enum([
  "HAND",
  "FOOT",
  "BODY",
  "HEAD",
  "BRAIN",
]);
export type EquipSlot = z.infer<typeof equipSlotSchema>;

export const itemCharacterSchema = z.object({
  id: z.string(),
  characterId: z.string(),
  sourceType: itemSourceTypeSchema,
  itemId: z.string(),
  quantity: z.number(),
  currentUses: z.number().optional().default(0),
  isEquipped: z.boolean(),
  equipSlots: z.array(equipSlotSchema).optional().default([]),
  customName: z.string().optional().nullable(),
  status: itemStatusSchema,
  itemLocation: z.string().optional(),
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
  /** TipTap rich text stored as HTML string */
  backstory: z.string().optional().nullable(),
  /** TipTap rich text stored as HTML string */
  summary: z.string().optional().nullable(),
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
    .nullish(),
  status: z.nativeEnum(Status).default("ALIVE"),
});

export const combatInformationSchema = z.object({
  initiativeMod: z.number(), // Needs to be computed
  speed: z.number(), // Needs to be computed
  reactionsPerRound: z.number(), // Needs to be computed
  armourMod: z.number().default(0),
  armourMaxHP: z.number().default(0),
  armourCurrentHP: z.number().default(0),
  rangeAttackMod: z.number(), // Needs to be computed
  meleeAttackMod: z.number(), // Needs to be computed
  throwAttackMod: z
    .number()
    .optional()
    .nullable()
    .transform((v) => v ?? 0),
  rangeDefenceMod: z.number(), // Needs to be computed
  meleeDefenceMod: z.number(), // Needs to be computed
  maxCarryWeight: z.number().optional(),
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

/** Rich text payload (TipTap JSON string) plus timestamps; stored in DB as JSON per array element. */
export const characterNoteEntrySchema = z.object({
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CharacterNoteEntry = z.infer<typeof characterNoteEntrySchema>;

export const characterNotesSchema = z.array(characterNoteEntrySchema);

export const characterSchema = z.object({
  generalInformation: generalInformationSchema,
  health: healthSchema,
  combatInformation: combatInformationSchema,
  innateAttributes: innateAttributesSchema,
  learnedSkills: z.object({
    generalSkills: generalSkillsSchema,
    specialSkills: z.array(z.string()).max(3).optional().nullish(),
  }),
  wallet: z
    .lazy(() => walletSchema)
    .optional()
    .nullish(),
  inventory: z
    .array(z.lazy(() => itemCharacterSchema))
    .optional()
    .nullish(),
  notes: characterNotesSchema.optional().nullish(),
  paths: z
    .array(z.lazy(() => pathSchema))
    .optional()
    .nullish(),
  features: z.array(z.lazy(() => featureSchema)).nullish(),
  games: z
    .array(z.lazy(() => gameCharacterWithGameSchema))
    .optional()
    .nullish(),
});

export type Character = z.infer<typeof characterSchema>;

export const characterDetailSchema = characterSchema.extend({
  id: z.string(),
});
export type CharacterDetail = z.infer<typeof characterDetailSchema>;

/** Minimal response expected from POST /api/characters */
export const characterCreateResponseSchema = z.object({
  id: z.string(),
});
export type CharacterCreateResponse = z.infer<
  typeof characterCreateResponseSchema
>;

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

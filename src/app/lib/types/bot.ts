import { z } from "zod";
import { BOT_DAMAGE_MARKS } from "@/app/lib/botDamageProfile";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";

const botAccessTypeSchema = z.enum(["PLAYER", "GAME_MASTER"]);
export type BotAccessType = z.infer<typeof botAccessTypeSchema>;

export const botSchema = z.object({
  accessType: botAccessTypeSchema,
  name: z.string().trim().min(1, "Name is required"),
  imageKey: z.string().trim().optional().nullable(),
  description: z.string().trim().min(1, "Description is required"),
  confCost: z.number().int(),
  usage: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  maxHp: z.number().int().min(1, "Max HP must be at least 1"),
  /** Unset means cargo is not capped. */
  maxCargoWeightKg: z.number().min(0).nullish(),
  /** Unset means installed hardware is not capped. */
  maxInstalledItems: z.number().int().min(0).nullish(),
});
export type Bot = z.infer<typeof botSchema>;

export const botUpdateSchema = botSchema.partial();
export type BotUpdate = z.infer<typeof botUpdateSchema>;

const optionalPlainText = z.string().trim().nullish();

export const customBotCreateSchema = z.object({
  gameId: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  description: optionalPlainText,
  confCost: z.number().int().nullish(),
  usage: optionalPlainText,
  notes: optionalPlainText,
  maxHp: z.number().int().min(1, "Max HP must be at least 1"),
  /**
   * When true, game members may later mint a Unique bot from this template.
   * Editing the shared Custom bot stays GM-only.
   */
  membersCanModify: z.boolean().optional().default(false),
  /** Unset means cargo is not capped. */
  maxCargoWeightKg: z.number().min(0).nullish(),
  /** Unset means installed hardware is not capped. */
  maxInstalledItems: z.number().int().min(0).nullish(),
});
export type CustomBotCreate = z.infer<typeof customBotCreateSchema>;

export const customBotCreateBodySchema = customBotCreateSchema.omit({
  gameId: true,
});
export type CustomBotCreateBody = z.infer<typeof customBotCreateBodySchema>;

export const customBotUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  description: optionalPlainText,
  confCost: z.number().int().nullish(),
  usage: optionalPlainText,
  notes: optionalPlainText,
  maxHp: z.number().int().min(1, "Max HP must be at least 1").optional(),
  membersCanModify: z.boolean().optional(),
  maxCargoWeightKg: z.number().min(0).nullish(),
  maxInstalledItems: z.number().int().min(0).nullish(),
});
export type CustomBotUpdate = z.infer<typeof customBotUpdateSchema>;

export const customBotResponseSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  confCost: z.number().int().nullish(),
  usage: z.string().nullish(),
  notes: z.string().nullish(),
  maxHp: z.number().int(),
  membersCanModify: z.boolean(),
  maxCargoWeightKg: z.number().nullish(),
  maxInstalledItems: z.number().int().nullish(),
});
export type CustomBotResponse = z.infer<typeof customBotResponseSchema>;

export const customBotListResponseSchema = z.array(customBotResponseSchema);

export const officialBotResponseSchema = z.object({
  id: z.string(),
  accessType: botAccessTypeSchema,
  name: z.string(),
  imageKey: z.string().nullish(),
  description: z.string(),
  confCost: z.number().int(),
  usage: z.string().nullish(),
  notes: z.string().nullish(),
  maxHp: z.number().int(),
  maxCargoWeightKg: z.number().nullish(),
  maxInstalledItems: z.number().int().nullish(),
});
export const officialBotListResponseSchema = z.array(officialBotResponseSchema);
export type OfficialBot = z.infer<typeof officialBotResponseSchema>;

const botDamageProfileEntrySchema = z.object({
  damageType: weaponDamageTypeSchema,
  mark: z.enum(BOT_DAMAGE_MARKS),
});

const botConditionSchema = z.enum(["OPERATIONAL", "BROKEN"]);

const botPlacedItemSchema = z.object({
  itemCharacterId: z.string(),
  quantity: z.number().int(),
  weightKg: z.number(),
  customName: z.string().nullish(),
  item: z
    .object({
      id: z.string(),
      name: z.string(),
      weight: z.number(),
      botInstallable: z.boolean(),
    })
    .nullable(),
});
const botPlacementSummarySchema = z.object({
  installedItems: z.array(botPlacedItemSchema).default([]),
  cargoItems: z.array(botPlacedItemSchema).default([]),
  carriedItems: z.array(botPlacedItemSchema).default([]),
  installedCount: z.number().int().default(0),
  cargoWeightKg: z.number().default(0),
  carriedWeightKg: z.number().default(0),
});
export type BotPlacementSummary = z.infer<typeof botPlacementSummarySchema>;

export const botHoldingSchema = botPlacementSummarySchema.extend({
  id: z.string(),
  characterId: z.string(),
  botId: z.string(),
  customName: z.string().nullish(),
  displayName: z.string(),
  currentHp: z.number().int(),
  maxHpBonus: z.number().int(),
  effectiveMaxHp: z.number().int().nullable(),
  notes: z.string().nullish(),
  condition: botConditionSchema,
  damageProfile: z.array(botDamageProfileEntrySchema),
  bot: z
    .object({
      id: z.string(),
      name: z.string(),
      imageKey: z.string().nullish(),
      description: z.string().nullish(),
      confCost: z.number().int().nullish(),
      usage: z.string().nullish(),
      notes: z.string().nullish(),
      maxHp: z.number().int(),
      accessType: botAccessTypeSchema.nullish(),
    })
    .nullable(),
  maxCargoWeightKg: z.number().nullish(),
  maxInstalledItems: z.number().int().nullish(),
});
export type BotHolding = z.infer<typeof botHoldingSchema>;

export const botSourceTypeSchema = z.enum(["OFFICIAL", "CUSTOM"]);
export type BotSourceType = z.infer<typeof botSourceTypeSchema>;

export const addBotToCharacterSchema = z
  .object({
    botId: z.string().min(1, "Bot is required"),
    sourceType: botSourceTypeSchema.optional(),
    gameId: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.sourceType ?? "OFFICIAL") === "CUSTOM" && !value.gameId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Game is required",
        path: ["gameId"],
      });
    }
  });
export type AddBotToCharacter = z.infer<typeof addBotToCharacterSchema>;

export const botHoldingPatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("setHp"),
    currentHp: z.number().int(),
  }),
  z.object({
    action: z.literal("setCustomName"),
    customName: z.string().nullable(),
  }),
  z.object({
    action: z.literal("setNotes"),
    notes: z.string().nullable(),
  }),
  z.object({
    action: z.literal("setMaxHpBonus"),
    maxHpBonus: z.number().int(),
  }),
]);
export type BotHoldingPatch = z.infer<typeof botHoldingPatchSchema>;

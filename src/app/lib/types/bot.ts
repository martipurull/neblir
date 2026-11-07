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
});
export type Bot = z.infer<typeof botSchema>;

export const botUpdateSchema = botSchema.partial();
export type BotUpdate = z.infer<typeof botUpdateSchema>;

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
});
export const officialBotListResponseSchema = z.array(officialBotResponseSchema);
export type OfficialBot = z.infer<typeof officialBotResponseSchema>;

const botDamageProfileEntrySchema = z.object({
  damageType: weaponDamageTypeSchema,
  mark: z.enum(BOT_DAMAGE_MARKS),
});

const botConditionSchema = z.enum(["OPERATIONAL", "BROKEN"]);

export const botHoldingSchema = z.object({
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
  bot: officialBotResponseSchema.nullable(),
});
export type BotHolding = z.infer<typeof botHoldingSchema>;

export const addBotToCharacterSchema = z.object({
  botId: z.string().min(1, "Bot is required"),
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

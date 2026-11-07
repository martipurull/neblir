import { z } from "zod";
import { BOT_DAMAGE_MARKS } from "@/app/lib/botDamageProfile";
import {
  BOT_ATTRIBUTE_MAX,
  BOT_ATTRIBUTE_MIN,
  BOT_BATTERY_CAPACITY_MAX,
  BOT_BATTERY_CAPACITY_MIN,
  BOT_MAX_POTENTIAL_MAX,
  BOT_MAX_POTENTIAL_MIN,
  BOT_UPGRADE_TRACKS,
} from "@/app/lib/botTracks";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";

const attributeBaseSchema = (label: string) =>
  z
    .number()
    .int()
    .min(BOT_ATTRIBUTE_MIN, `${label} must stay from -5 through +5`)
    .max(BOT_ATTRIBUTE_MAX, `${label} must stay from -5 through +5`);

const maxPotentialSchema = (label: string) =>
  z
    .number()
    .int()
    .min(
      BOT_MAX_POTENTIAL_MIN,
      `${label} max potential must stay from 0 through +5`
    )
    .max(
      BOT_MAX_POTENTIAL_MAX,
      `${label} max potential must stay from 0 through +5`
    );

const batteryCapacitySchema = z
  .number()
  .int()
  .min(BOT_BATTERY_CAPACITY_MIN, "Battery capacity must stay from 1 through 10")
  .max(
    BOT_BATTERY_CAPACITY_MAX,
    "Battery capacity must stay from 1 through 10"
  );

const botTrackInputShape = {
  processingPower: attributeBaseSchema("Processing Power").optional(),
  processingPowerMaxPotential:
    maxPotentialSchema("Processing Power").optional(),
  physicalPower: attributeBaseSchema("Physical Power").optional(),
  physicalPowerMaxPotential: maxPotentialSchema("Physical Power").optional(),
  finesseCapacity: attributeBaseSchema("Finesse Capacity").optional(),
  finesseCapacityMaxPotential:
    maxPotentialSchema("Finesse Capacity").optional(),
  gridProtection: attributeBaseSchema("Grid Protection").optional(),
  gridProtectionMaxPotential: maxPotentialSchema("Grid Protection").optional(),
  batteryCapacity: batteryCapacitySchema.optional(),
  batteryMaxPotential: maxPotentialSchema("Battery").optional(),
};

const botTrackOverrideShape = {
  processingPowerOverride: attributeBaseSchema("Processing Power").nullish(),
  processingPowerMaxPotentialOverride:
    maxPotentialSchema("Processing Power").nullish(),
  physicalPowerOverride: attributeBaseSchema("Physical Power").nullish(),
  physicalPowerMaxPotentialOverride:
    maxPotentialSchema("Physical Power").nullish(),
  finesseCapacityOverride: attributeBaseSchema("Finesse Capacity").nullish(),
  finesseCapacityMaxPotentialOverride:
    maxPotentialSchema("Finesse Capacity").nullish(),
  gridProtectionOverride: attributeBaseSchema("Grid Protection").nullish(),
  gridProtectionMaxPotentialOverride:
    maxPotentialSchema("Grid Protection").nullish(),
  batteryCapacityOverride: batteryCapacitySchema.nullish(),
  batteryMaxPotentialOverride: maxPotentialSchema("Battery").nullish(),
};

const botTrackResponseShape = {
  processingPower: z.number().int().default(0),
  processingPowerMaxPotential: z.number().int().default(0),
  physicalPower: z.number().int().default(0),
  physicalPowerMaxPotential: z.number().int().default(0),
  finesseCapacity: z.number().int().default(0),
  finesseCapacityMaxPotential: z.number().int().default(0),
  gridProtection: z.number().int().default(0),
  gridProtectionMaxPotential: z.number().int().default(0),
  batteryCapacity: z.number().int().default(1),
  batteryMaxPotential: z.number().int().default(0),
};

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
  /** Movement speed in metres, before carry load. */
  speed: z.number().int().min(0).optional(),
  /** Base max carry weight in kilograms. */
  maxCarryWeight: z.number().min(0).optional(),
  /** Descriptive height in metres. Does not encumber the holding character. */
  heightMetres: z.number().min(0).nullish(),
  /** Descriptive weight in kilograms. Does not encumber the holding character. */
  weight: z.number().min(0).nullish(),
  ...botTrackInputShape,
});
export type Bot = z.infer<typeof botSchema>;

export const botUpdateSchema = botSchema.partial();
export type BotUpdate = z.infer<typeof botUpdateSchema>;

const optionalPlainText = z.string().trim().nullish();

const customBotCreateSchema = z.object({
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
  speed: z.number().int().min(0).optional(),
  maxCarryWeight: z.number().min(0).optional(),
  heightMetres: z.number().min(0).nullish(),
  weight: z.number().min(0).nullish(),
  ...botTrackInputShape,
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
  speed: z.number().int().min(0).optional(),
  maxCarryWeight: z.number().min(0).optional(),
  heightMetres: z.number().min(0).nullish(),
  weight: z.number().min(0).nullish(),
  ...botTrackInputShape,
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
  speed: z.number().default(0),
  maxCarryWeight: z.number().default(0),
  heightMetres: z.number().nullish(),
  weight: z.number().nullish(),
  ...botTrackResponseShape,
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
  speed: z.number().default(0),
  maxCarryWeight: z.number().default(0),
  heightMetres: z.number().nullish(),
  weight: z.number().nullish(),
  ...botTrackResponseShape,
});
export const officialBotListResponseSchema = z.array(officialBotResponseSchema);
export type OfficialBot = z.infer<typeof officialBotResponseSchema>;

const botDamageProfileEntrySchema = z.object({
  damageType: weaponDamageTypeSchema,
  mark: z.enum(BOT_DAMAGE_MARKS),
});

const botConditionSchema = z.enum(["OPERATIONAL", "BROKEN", "BEYOND_REPAIR"]);

const botAttributeFigureSchema = z.object({
  base: z.number().int(),
  maxPotential: z.number().int(),
  upgrade: z.number().int(),
  effective: z.number().int(),
  signedUpgrade: z.string().nullable(),
});

const botBatteryFigureSchema = z.object({
  base: z.number().int(),
  maxPotential: z.number().int(),
  upgrade: z.number().int(),
  effectiveCapacity: z.number().int(),
  signedUpgrade: z.string().nullable(),
  used: z.number().int(),
  remaining: z.number().int(),
});

const botRollBlockReasonSchema = z.enum([
  "BROKEN",
  "BEYOND_REPAIR",
  "BATTERY_EMPTY",
]);

const botPlaceSchema = z.enum(["installed", "cargo", "carried"]);
export type BotPlace = z.infer<typeof botPlaceSchema>;

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
      equipSlotCost: z.number().nullish(),
      equipSlotTypes: z.array(z.string()).default([]),
    })
    .nullable(),
  botEquipSlots: z.array(z.string()).default([]),
});
export type BotPlacedItem = z.infer<typeof botPlacedItemSchema>;

export type BotPlacementSummary = {
  installedItems: BotPlacedItem[];
  cargoItems: BotPlacedItem[];
  carriedItems: BotPlacedItem[];
  installedCount: number;
  cargoWeightKg: number;
  carriedWeightKg: number;
};

export const placeBotItemSchema = z.object({
  itemCharacterId: z.string().min(1, "Item is required"),
  place: botPlaceSchema,
});

export const transferBotHoldingSchema = z.object({
  toCharacterId: z.string().min(1, "Recipient is required"),
});

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
  installedItems: z.array(botPlacedItemSchema).default([]),
  cargoItems: z.array(botPlacedItemSchema).default([]),
  carriedItems: z.array(botPlacedItemSchema).default([]),
  installedCount: z.number().int().default(0),
  cargoWeightKg: z.number().default(0),
  carriedWeightKg: z.number().default(0),
  /** Base speed in metres, before carry load. */
  speed: z.number().default(0),
  effectiveSpeed: z.number().default(0),
  /** True when carry load reduces the base speed. The sheet strikes the base through. */
  speedStrikethrough: z.boolean().default(false),
  /** Base max carry weight in kilograms. */
  maxCarryWeight: z.number().default(0),
  /** Base max carry plus a Body backpack bonus. Null when the base is not positive. */
  effectiveMaxCarryWeight: z.number().nullable().default(null),
  /** Descriptive height in metres. */
  heightMetres: z.number().nullish(),
  /** Descriptive weight in kilograms. Does not encumber the holding character. */
  weight: z.number().nullish(),
  attributes: z.object({
    processingPower: botAttributeFigureSchema,
    physicalPower: botAttributeFigureSchema,
    finesseCapacity: botAttributeFigureSchema,
    gridProtection: botAttributeFigureSchema,
  }),
  battery: botBatteryFigureSchema,
  isBeyondRepair: z.boolean(),
  mayRoll: z.boolean(),
  rollBlockedReason: botRollBlockReasonSchema.nullable(),
  sourceType: z
    .enum(["OFFICIAL", "CUSTOM", "UNIQUE"])
    .optional()
    .default("OFFICIAL"),
  /** Set when the holding is a Unique bot. The minter is the only editor of that record. */
  uniqueOwnerUserId: z.string().nullish(),
  /** Game that owns a Unique bot. */
  gameId: z.string().nullish(),
});
export type BotHolding = z.infer<typeof botHoldingSchema>;

const botSourceTypeSchema = z.enum(["OFFICIAL", "CUSTOM", "UNIQUE"]);
export type BotSourceType = z.infer<typeof botSourceTypeSchema>;

const botTemplateSourceTypeSchema = z.enum([
  "OFFICIAL",
  "CUSTOM",
  "STANDALONE",
]);
export type BotTemplateSourceType = z.infer<typeof botTemplateSourceTypeSchema>;

const uniqueBotMutableBodySchema = z.object({
  gameId: z.string().min(1),
  nameOverride: z.string().trim().min(1).nullish(),
  imageKeyOverride: z.string().trim().min(1).nullish(),
  descriptionOverride: z.string().trim().nullish(),
  confCostOverride: z.number().int().nullish(),
  usageOverride: z.string().trim().nullish(),
  notesOverride: z.string().trim().nullish(),
  maxHpOverride: z.number().int().min(1, "Max HP must be at least 1").nullish(),
  maxCargoWeightKgOverride: z.number().min(0).nullish(),
  maxInstalledItemsOverride: z.number().int().min(0).nullish(),
  speedOverride: z.number().int().min(0).nullish(),
  maxCarryWeightOverride: z.number().min(0).nullish(),
  heightMetresOverride: z.number().min(0).nullish(),
  weightOverride: z.number().min(0).nullish(),
  ...botTrackOverrideShape,
});

export const uniqueBotCreateSchema = z.union([
  uniqueBotMutableBodySchema.extend({
    sourceType: z.literal("OFFICIAL"),
    botId: z.string().min(1, "Bot is required"),
  }),
  uniqueBotMutableBodySchema.extend({
    sourceType: z.literal("CUSTOM"),
    botId: z.string().min(1, "Bot is required"),
  }),
  uniqueBotMutableBodySchema.extend({
    sourceType: z.literal("STANDALONE"),
    nameOverride: z.string().trim().min(1, "Name is required"),
    maxHpOverride: z.number().int().min(1, "Max HP must be at least 1"),
  }),
]);
export type UniqueBotCreate = z.infer<typeof uniqueBotCreateSchema>;

export const uniqueBotUpdateSchema = uniqueBotMutableBodySchema
  .omit({ gameId: true })
  .partial();
export type UniqueBotUpdate = z.infer<typeof uniqueBotUpdateSchema>;

const uniqueBotRecordSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  gameId: z.string(),
  sourceType: botTemplateSourceTypeSchema,
  botId: z.string().nullish(),
  nameOverride: z.string().nullish(),
  imageKeyOverride: z.string().nullish(),
  descriptionOverride: z.string().nullish(),
  confCostOverride: z.number().int().nullish(),
  usageOverride: z.string().nullish(),
  notesOverride: z.string().nullish(),
  maxHpOverride: z.number().int().nullish(),
  maxCargoWeightKgOverride: z.number().nullish(),
  maxInstalledItemsOverride: z.number().int().nullish(),
  speedOverride: z.number().int().nullish(),
  maxCarryWeightOverride: z.number().nullish(),
  heightMetresOverride: z.number().nullish(),
  weightOverride: z.number().nullish(),
  ...botTrackOverrideShape,
  templateName: z.string().nullish(),
});
export type UniqueBotRecord = z.infer<typeof uniqueBotRecordSchema>;

export const uniqueBotDetailResponseSchema = uniqueBotRecordSchema;
export type UniqueBotDetailResponse = UniqueBotRecord;

export const uniqueBotCreateResponseSchema = z.object({
  id: z.string(),
});
export type UniqueBotCreateResponse = z.infer<
  typeof uniqueBotCreateResponseSchema
>;

export const uniqueBotUpdateResponseSchema = uniqueBotRecordSchema;
export type UniqueBotUpdateResponse = UniqueBotRecord;

const uniqueBotListItemSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  name: z.string(),
  held: z.boolean(),
});
export type UniqueBotListItem = z.infer<typeof uniqueBotListItemSchema>;

export const uniqueBotListResponseSchema = z.array(uniqueBotListItemSchema);

const botEquipSlotSchema = z.enum(["HAND", "FOOT", "BODY", "HEAD", "BRAIN"]);

export const botEquipSchema = z.object({
  itemCharacterId: z.string().min(1, "Item is required"),
  action: z.enum(["equip", "unequip"]),
  slot: botEquipSlotSchema,
});
export type BotEquip = z.infer<typeof botEquipSchema>;

export const giveBotSchema = z.object({
  characterId: z.string().min(1, "Character is required"),
  sourceType: botSourceTypeSchema,
  botId: z.string().min(1, "Bot is required"),
});
export type GiveBot = z.infer<typeof giveBotSchema>;

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
  z.object({
    action: z.literal("setUpgrade"),
    track: z.enum(BOT_UPGRADE_TRACKS),
    upgrade: z.number().int(),
  }),
  z.object({
    action: z.literal("setBatteryUsed"),
    batteryUsed: z.number().int(),
  }),
  z.object({
    action: z.literal("setBeyondRepair"),
    isBeyondRepair: z.boolean(),
  }),
]);
export type BotHoldingPatch = z.infer<typeof botHoldingPatchSchema>;

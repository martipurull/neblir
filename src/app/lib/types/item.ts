import { z } from "zod";
import {
  itemAttributePathSchema,
  itemGeneralSkillSchema,
} from "@/app/lib/itemModifierEnums";

export const currencyNameSchema = z.enum([
  "CONF",
  "NORD",
  "NAS",
  "HUMF",
  "MRARK",
]);

const currencySchema = z.object({
  currencyName: currencyNameSchema,
  quantity: z.number().min(0),
});

export type Currency = z.infer<typeof currencySchema>;

export const walletSchema = z
  .array(currencySchema)
  .superRefine((wallet, ctx) => {
    const seen = new Set<string>();
    for (const entry of wallet) {
      if (seen.has(entry.currencyName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate currency '${entry.currencyName}' is not allowed.`,
        });
      }
      seen.add(entry.currencyName);
    }
  });

export type Wallet = z.infer<typeof walletSchema>;

export const walletAdjustmentSchema = z.object({
  currencyName: currencyNameSchema,
  amount: z.number().int().positive(),
});
export type WalletAdjustment = z.infer<typeof walletAdjustmentSchema>;

export const weaponAttackRollTypeSchema = z.enum([
  "RANGE",
  "MELEE",
  "GRID",
  "THROW",
]);
export const weaponDamageTypeSchema = z.enum([
  "BULLET",
  "BLADE",
  "SIIKE",
  "ACID",
  "FIRE",
  "ICE",
  "BLUDGEONING",
  "ELECTRICITY",
  "NERVE",
  "GRID",
  "POISON",
  "OTHER",
]);

export type WeaponDamageType = z.infer<typeof weaponDamageTypeSchema>;

export const itemAreaTypeSchema = z.enum(["RADIUS", "CONE"]);
export type ItemAreaType = z.infer<typeof itemAreaTypeSchema>;

/** Slot types an item can be equipped to */
export const equipSlotTypeSchema = z.enum([
  "HAND",
  "FOOT",
  "BODY",
  "HEAD",
  "BRAIN",
]);
export type EquipSlotType = z.infer<typeof equipSlotTypeSchema>;

/** Cost in slots when equipping (0, 1, or 2) */
export const equipSlotCostSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);
export type EquipSlotCost = z.infer<typeof equipSlotCostSchema>;

export const itemSourceTypeSchema = z.enum([
  "GLOBAL_ITEM",
  "CUSTOM_ITEM",
  "UNIQUE_ITEM",
]);
export type ItemSourceType = z.infer<typeof itemSourceTypeSchema>;

export const itemStatusSchema = z.enum([
  "FUNCTIONAL",
  "BROKEN",
  "BEYOND_REPAIR",
]);
export type ItemStatus = z.infer<typeof itemStatusSchema>;

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  FUNCTIONAL: "Functional",
  BROKEN: "Broken",
  BEYOND_REPAIR: "Beyond repair",
};

/** Only functional items may be equipped, grant combat/armour bonuses, or hold charges. */
export function isItemInventoryOperational(status: ItemStatus): boolean {
  return status === "FUNCTIONAL";
}

/** Inventory list equip column when an equippable item is damaged (short lowercase line). */
export function itemStatusEquipColumnDamageLabel(
  status: ItemStatus
): string | null {
  if (status === "BROKEN") return "broken";
  if (status === "BEYOND_REPAIR") return "beyond repair";
  return null;
}

/** Source type stored on UniqueItem (template or standalone). */
export const uniqueItemSourceTypeSchema = z.enum([
  "GLOBAL_ITEM",
  "CUSTOM_ITEM",
  "STANDALONE",
]);
export type UniqueItemSourceType = z.infer<typeof uniqueItemSourceTypeSchema>;

const areaEffectSchema = z.object({
  defenceReactionCost: z.number(),
  defenceRoll: z.string(),
  successfulDefenceResult: z.string(),
});

export const itemDamageSchema = z.object({
  damageType: z.array(weaponDamageTypeSchema),
  diceType: z.number(),
  numberOfDice: z.number(),
  areaType: itemAreaTypeSchema.optional(),
  coneLength: z.number().optional(),
  primaryRadius: z.number().optional(),
  secondaryRadius: z.number().optional(),
  areaEffect: areaEffectSchema.optional(),
});
export type ItemDamage = z.infer<typeof itemDamageSchema>;

/** Response variant allows nullable nested fields from persisted data. */
const itemDamageResponseSchema = z.object({
  damageType: z.array(weaponDamageTypeSchema),
  diceType: z.number(),
  numberOfDice: z.number(),
  areaType: itemAreaTypeSchema.nullish(),
  coneLength: z.number().nullish(),
  primaryRadius: z.number().nullish(),
  secondaryRadius: z.number().nullish(),
  areaEffect: areaEffectSchema.nullish(),
});

// ---- Global Item (Item model) ----

const baseItemSchema = z.object({
  type: z.enum(["GENERAL_ITEM", "WEAPON"]),
  accessType: z.enum(["PLAYER", "GAME_MASTER"]),
  name: z.string(),
  imageKey: z.string().optional(),
  confCost: z.number(),
  costInfo: z
    .string()
    .optional()
    .describe("e.g. cost per unit, not for sale, illegal item, etc."),
  description: z.string(),
  notes: z.string().optional(),
  weight: z.number(), // required for global Item model
  equippable: z.boolean().optional().default(false),
  equipSlotTypes: z.array(equipSlotTypeSchema).optional().default([]),
  equipSlotCost: equipSlotCostSchema.optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  defenceMeleeBonus: z.number().optional(),
  defenceRangeBonus: z.number().optional(),
  gridAttackBonus: z.number().optional(),
  gridDefenceBonus: z.number().optional(),
  effectiveRange: z.number().int().optional().nullable(),
  maxRange: z.number().int().optional().nullable(),
  modifiesAttribute: itemAttributePathSchema.nullish(),
  attributeMod: z.number().int().nullish(),
  modifiesSkill: itemGeneralSkillSchema.nullish(),
  skillMod: z.number().int().nullish(),
  isSpeedAltered: z.boolean().optional(),
});

export const generalItemSchema = baseItemSchema.extend({
  type: z.literal("GENERAL_ITEM"),
  usage: z.string(),
});

export type GeneralItem = z.infer<typeof generalItemSchema>;

export const weaponSchema = baseItemSchema.extend({
  type: z.literal("WEAPON"),
  usage: z.string().optional(),
  attackRoll: z.array(weaponAttackRollTypeSchema),
  attackMeleeBonus: z.number().optional(),
  attackRangeBonus: z.number().optional(),
  attackThrowBonus: z.number().optional(),
  damage: itemDamageSchema,
});

export type Weapon = z.infer<typeof weaponSchema>;

export const itemSchema = z.discriminatedUnion("type", [
  generalItemSchema,
  weaponSchema,
]);
export const itemUpdateSchema = z.union([
  generalItemSchema.partial(),
  weaponSchema.partial(),
]);

export type Item = z.infer<typeof itemSchema>;

// ---- Custom Item ----

export const customItemCreateSchema = z.object({
  gameId: z.string(),
  name: z.string(),
  weight: z.number(),
  type: z.enum(["GENERAL_ITEM", "WEAPON"]).optional().default("GENERAL_ITEM"),
  attackRoll: z.array(weaponAttackRollTypeSchema).optional().default([]),
  attackMeleeBonus: z.number().optional(),
  attackRangeBonus: z.number().optional(),
  attackThrowBonus: z.number().optional(),
  defenceMeleeBonus: z.number().optional(),
  defenceRangeBonus: z.number().optional(),
  gridAttackBonus: z.number().optional(),
  gridDefenceBonus: z.number().optional(),
  effectiveRange: z.number().int().optional().nullable(),
  maxRange: z.number().int().optional().nullable(),
  confCost: z.number().optional(),
  costInfo: z.string().optional(),
  damage: itemDamageSchema.optional(),
  description: z.string().optional(),
  imageKey: z.string().optional(),
  notes: z.string().optional(),
  usage: z.string().optional(),
  equippable: z.boolean().optional(),
  equipSlotTypes: z.array(equipSlotTypeSchema).optional(),
  equipSlotCost: equipSlotCostSchema.optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  modifiesAttribute: itemAttributePathSchema.nullish(),
  attributeMod: z.number().int().nullish(),
  modifiesSkill: itemGeneralSkillSchema.nullish(),
  skillMod: z.number().int().nullish(),
  isSpeedAltered: z.boolean().optional(),
});
export type CustomItemCreate = z.infer<typeof customItemCreateSchema>;

export const customItemUpdateSchema = customItemCreateSchema
  .omit({ gameId: true })
  .partial();
export type CustomItemUpdate = z.infer<typeof customItemUpdateSchema>;

// ---- Unique Item ----

/** Optional override fields shared by create (all branches) and PATCH. */
const uniqueItemMutableBodySchema = z.object({
  gameId: z.string().optional(),
  attackRollOverride: z.array(weaponAttackRollTypeSchema).optional(),
  attackMeleeBonusOverride: z.number().optional(),
  attackRangeBonusOverride: z.number().optional(),
  attackThrowBonusOverride: z.number().optional(),
  defenceMeleeBonusOverride: z.number().optional(),
  defenceRangeBonusOverride: z.number().optional(),
  gridAttackBonusOverride: z.number().optional(),
  gridDefenceBonusOverride: z.number().optional(),
  effectiveRangeOverride: z.number().int().optional().nullable(),
  maxRangeOverride: z.number().int().optional().nullable(),
  confCostOverride: z.number().optional(),
  costInfoOverride: z.string().optional(),
  damageOverride: itemDamageSchema.optional(),
  descriptionOverride: z.string().optional(),
  imageKeyOverride: z.string().optional(),
  nameOverride: z.string().optional(),
  usageOverride: z.string().optional(),
  weightOverride: z.number().optional(),
  notesOverride: z.string().optional(),
  specialTag: z.string().optional(),
  equippableOverride: z.boolean().optional(),
  equipSlotTypesOverride: z.array(equipSlotTypeSchema).optional(),
  equipSlotCostOverride: equipSlotCostSchema.optional(),
  /** Prefer `maxUsesOverride`; `maxUses` is an accepted alias for clients. */
  maxUsesOverride: z.number().int().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  modifiesAttributeOverride: itemAttributePathSchema.nullish(),
  attributeModOverride: z.number().int().nullish(),
  modifiesSkillOverride: itemGeneralSkillSchema.nullish(),
  skillModOverride: z.number().int().nullish(),
  isSpeedAlteredOverride: z.boolean().nullish(),
});

export const uniqueItemCreateSchema = z.union([
  uniqueItemMutableBodySchema.extend({
    sourceType: z.literal("GLOBAL_ITEM"),
    itemId: z.string(),
  }),
  uniqueItemMutableBodySchema.extend({
    sourceType: z.literal("CUSTOM_ITEM"),
    itemId: z.string(),
  }),
  uniqueItemMutableBodySchema.extend({
    sourceType: z.literal("STANDALONE"),
    nameOverride: z
      .string()
      .trim()
      .min(1, "Name is required for a custom item without a template"),
    weightOverride: z.number().finite().min(0, "Weight must be 0 or greater"),
  }),
]);
export type UniqueItemCreate = z.infer<typeof uniqueItemCreateSchema>;

export const uniqueItemUpdateSchema = uniqueItemMutableBodySchema.partial();
export type UniqueItemUpdate = z.infer<typeof uniqueItemUpdateSchema>;

// ---- Add to inventory ----

export const addToInventorySchema = z.object({
  sourceType: itemSourceTypeSchema,
  itemId: z.string(),
});
export type AddToInventory = z.infer<typeof addToInventorySchema>;

// ---- API response schemas ----

/** Global item returned by GET /api/items and GET /api/items/[id]. */
export const itemResponseSchema = z.object({
  id: z.string(),
  type: z.enum(["GENERAL_ITEM", "WEAPON"]),
  accessType: z.enum(["PLAYER", "GAME_MASTER"]),
  name: z.string(),
  imageKey: z.string().nullish(),
  confCost: z.number(),
  costInfo: z.string().nullish(),
  description: z.string(),
  notes: z.string().nullish(),
  weight: z.number(),
  usage: z.string().nullish(),
  attackRoll: z.array(weaponAttackRollTypeSchema).nullish(),
  attackMeleeBonus: z.number().nullish(),
  attackRangeBonus: z.number().nullish(),
  attackThrowBonus: z.number().nullish(),
  defenceMeleeBonus: z.number().nullish(),
  defenceRangeBonus: z.number().nullish(),
  gridAttackBonus: z.number().nullish(),
  gridDefenceBonus: z.number().nullish(),
  effectiveRange: z.number().int().nullish(),
  maxRange: z.number().int().nullish(),
  damage: itemDamageResponseSchema.nullish(),
  equippable: z.boolean().nullish(),
  equipSlotTypes: z.array(z.string()).nullish(),
  equipSlotCost: z.number().nullish(),
  maxUses: z.number().int().positive().nullish(),
  modifiesAttribute: itemAttributePathSchema.nullish(),
  attributeMod: z.number().int().nullish(),
  modifiesSkill: itemGeneralSkillSchema.nullish(),
  skillMod: z.number().int().nullish(),
  isSpeedAltered: z.boolean().nullish(),
});
export const itemListResponseSchema = z.array(itemResponseSchema);
export type ItemResponse = z.infer<typeof itemResponseSchema>;

/** Custom item returned by GET /api/games/[id]/custom-items and related endpoints */
export const customItemResponseSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  weight: z.number(),
  type: z.enum(["GENERAL_ITEM", "WEAPON"]),
  attackRoll: z.array(weaponAttackRollTypeSchema).default([]),
  attackMeleeBonus: z.number().nullish(),
  attackRangeBonus: z.number().nullish(),
  attackThrowBonus: z.number().nullish(),
  defenceMeleeBonus: z.number().nullish(),
  defenceRangeBonus: z.number().nullish(),
  gridAttackBonus: z.number().nullish(),
  gridDefenceBonus: z.number().nullish(),
  effectiveRange: z.number().int().nullish(),
  maxRange: z.number().int().nullish(),
  confCost: z.number().nullish(),
  costInfo: z.string().nullish(),
  damage: itemDamageResponseSchema.nullish(),
  description: z.string().nullish(),
  imageKey: z.string().nullish(),
  notes: z.string().nullish(),
  usage: z.string().nullish(),
  equippable: z.boolean().nullish(),
  equipSlotTypes: z.array(z.string()).nullish(),
  equipSlotCost: z.number().nullish(),
  maxUses: z.number().int().positive().nullish(),
  modifiesAttribute: itemAttributePathSchema.nullish(),
  attributeMod: z.number().int().nullish(),
  modifiesSkill: itemGeneralSkillSchema.nullish(),
  skillMod: z.number().int().nullish(),
  isSpeedAltered: z.boolean().nullish(),
});
export const customItemListResponseSchema = z.array(customItemResponseSchema);
export type CustomItemResponse = z.infer<typeof customItemResponseSchema>;

/** Unique item list row returned by GET /api/games/[id]/unique-items */
export const uniqueItemListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export const uniqueItemListResponseSchema = z.array(
  uniqueItemListItemResponseSchema
);
export type UniqueItemListItemResponse = z.infer<
  typeof uniqueItemListItemResponseSchema
>;

/** Minimal response expected from unique item creation endpoints. */
export const uniqueItemCreateResponseSchema = z.object({
  id: z.string(),
});
export type UniqueItemCreateResponse = z.infer<
  typeof uniqueItemCreateResponseSchema
>;

/** Unique item returned by GET /api/unique-items/[id] (raw + resolved/template forms). */
export const uniqueItemResolvedResponseSchema = z.object({
  id: z.string(),
  ownerUserId: z.string(),
  gameId: z.string().nullish(),
  sourceType: uniqueItemSourceTypeSchema,
  itemId: z.string().nullish(),
  attackRollOverride: z.array(weaponAttackRollTypeSchema).default([]),
  attackMeleeBonusOverride: z.number().nullish(),
  attackRangeBonusOverride: z.number().nullish(),
  attackThrowBonusOverride: z.number().nullish(),
  defenceMeleeBonusOverride: z.number().nullish(),
  defenceRangeBonusOverride: z.number().nullish(),
  gridAttackBonusOverride: z.number().nullish(),
  gridDefenceBonusOverride: z.number().nullish(),
  effectiveRangeOverride: z.number().int().nullish(),
  maxRangeOverride: z.number().int().nullish(),
  confCostOverride: z.number().nullish(),
  costInfoOverride: z.string().nullish(),
  damageOverride: itemDamageResponseSchema.nullish(),
  descriptionOverride: z.string().nullish(),
  imageKeyOverride: z.string().nullish(),
  nameOverride: z.string().nullish(),
  usageOverride: z.string().nullish(),
  weightOverride: z.number().nullish(),
  notesOverride: z.string().nullish(),
  specialTag: z.string().nullish(),
  equippableOverride: z.boolean().nullish(),
  equipSlotTypesOverride: z.unknown().nullish(),
  equipSlotCostOverride: z.number().nullish(),
  maxUsesOverride: z.number().int().positive().nullish(),
  modifiesAttributeOverride: itemAttributePathSchema.nullish(),
  attributeModOverride: z.number().int().nullish(),
  modifiesSkillOverride: itemGeneralSkillSchema.nullish(),
  skillModOverride: z.number().int().nullish(),
  isSpeedAlteredOverride: z.boolean().nullish(),
  templateItem: z
    .union([itemResponseSchema, customItemResponseSchema])
    .nullish(),
  resolvedItem: z
    .union([itemResponseSchema, customItemResponseSchema])
    .nullish(),
});
export type UniqueItemResolvedResponse = z.infer<
  typeof uniqueItemResolvedResponseSchema
>;

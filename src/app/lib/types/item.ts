import { z } from "zod";

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
  "OTHER",
]);

export const itemSourceTypeSchema = z.enum([
  "GLOBAL_ITEM",
  "CUSTOM_ITEM",
  "UNIQUE_ITEM",
]);
export type ItemSourceType = z.infer<typeof itemSourceTypeSchema>;

/** Source type for UniqueItem template (only GLOBAL_ITEM or CUSTOM_ITEM) */
export const uniqueItemSourceTypeSchema = z.enum([
  "GLOBAL_ITEM",
  "CUSTOM_ITEM",
]);
export type UniqueItemSourceType = z.infer<typeof uniqueItemSourceTypeSchema>;

const areaEffectSchema = z.object({
  defenceReactionCost: z.number(),
  defenceRoll: z.string(),
  successfulDefenceResult: z.string(),
});

export const itemDamageSchema = z.object({
  damageType: weaponDamageTypeSchema,
  diceType: z.number(),
  numberOfDice: z.number(),
  primaryRadius: z.number().optional(),
  secondaryRadius: z.number().optional(),
  areaEffect: areaEffectSchema.optional(),
});
export type ItemDamage = z.infer<typeof itemDamageSchema>;

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
});

export const generalItemSchema = baseItemSchema.extend({
  type: z.literal("GENERAL_ITEM"),
  usage: z.string(),
});

export type GeneralItem = z.infer<typeof generalItemSchema>;

export const weaponSchema = baseItemSchema.extend({
  type: z.literal("WEAPON"),
  attackRoll: z.array(weaponAttackRollTypeSchema),
  attackBonus: z.number(),
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
  attackBonus: z.number().optional(),
  confCost: z.number().optional(),
  costInfo: z.string().optional(),
  damage: itemDamageSchema.optional(),
  description: z.string().optional(),
  imageKey: z.string().optional(),
  notes: z.string().optional(),
  usage: z.string().optional(),
});
export type CustomItemCreate = z.infer<typeof customItemCreateSchema>;

export const customItemUpdateSchema = customItemCreateSchema
  .omit({ gameId: true })
  .partial();
export type CustomItemUpdate = z.infer<typeof customItemUpdateSchema>;

// ---- Unique Item ----

const uniqueItemOverrideFieldsSchema = z.object({
  sourceType: uniqueItemSourceTypeSchema,
  itemId: z.string(),
  attackRollOverride: z.array(weaponAttackRollTypeSchema).optional(),
  attackBonusOverride: z.number().optional(),
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
});

export const uniqueItemCreateSchema = uniqueItemOverrideFieldsSchema;
export type UniqueItemCreate = z.infer<typeof uniqueItemCreateSchema>;

export const uniqueItemUpdateSchema = uniqueItemOverrideFieldsSchema
  .omit({ sourceType: true, itemId: true })
  .partial();
export type UniqueItemUpdate = z.infer<typeof uniqueItemUpdateSchema>;

// ---- Add to inventory ----

export const addToInventorySchema = z.object({
  sourceType: itemSourceTypeSchema,
  itemId: z.string(),
});
export type AddToInventory = z.infer<typeof addToInventorySchema>;

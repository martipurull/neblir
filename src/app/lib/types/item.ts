import { z } from "zod";

const currencySchema = z.object({
  currencyName: z.string(),
  quantity: z.number(),
});

export const walletSchema = z.array(currencySchema);

export type Wallet = z.infer<typeof walletSchema>;

const weaponAttackRollTypeSchema = z.enum(["RANGE", "MELEE", "GRID", "THROW"]);
const weaponDamageTypeSchema = z.enum([
  "BULLET",
  "BLADE",
  "SIIKE",
  "ACID",
  "FIRE",
  "ICE",
]);

const baseItemSchema = z.object({
  type: z.enum(["GENERAL_ITEM", "WEAPON"]),
  name: z.string(),
  imageKey: z.string().optional(),
  confCost: z.number(),
  costInfo: z
    .string()
    .optional()
    .describe("e.g. cost per unit, not for sale, illegal item, etc."),
  description: z.string(),
  notes: z.string().optional(),
  weight: z.number().optional(),
});

export const generalItemSchema = baseItemSchema.extend({
  type: z.literal("GENERAL_ITEM"),
  usage: z.string(),
});

export type GeneralItem = z.infer<typeof generalItemSchema>;

export const weaponSchema = baseItemSchema.extend({
  type: z.literal("WEAPON"),
  attackRoll: z.array(weaponAttackRollTypeSchema),
  damage: z.object({
    diceType: z.number(),
    numberOfDice: z.number(),
    damageType: weaponDamageTypeSchema,
    primaryRadius: z.number().optional(),
    secondaryRadius: z.number().optional(),
    areaEffect: z
      .object({
        defenceReactionCost: z.number(),
        defenceRoll: z.string(),
        successfulDefenceResult: z.string(),
      })
      .optional(),
  }),
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

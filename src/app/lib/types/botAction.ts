import { z } from "zod";
import { weaponDamageTypeSchema } from "@/app/lib/types/weaponDamage";

/** Attributes a bot action or its damage block may add. Grid Protection is not one. */
const BOT_ACTION_ATTRIBUTES = [
  "processingPower",
  "physicalPower",
  "finesseCapacity",
] as const;

export type BotActionAttribute = (typeof BOT_ACTION_ATTRIBUTES)[number];

const BOT_ACTION_ATTRIBUTE_SET = new Set<string>(BOT_ACTION_ATTRIBUTES);

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function botActionAttributeField(label: string) {
  return z
    .string()
    .nullish()
    .superRefine((value, ctx) => {
      if (value == null || value === "") return;
      if (value === "gridProtection") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Grid Protection is not a bot action attribute.",
        });
        return;
      }
      if (!BOT_ACTION_ATTRIBUTE_SET.has(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be Processing Power, Physical Power, or Finesse Capacity.`,
        });
      }
    })
    .transform((value): BotActionAttribute | null => {
      if (value == null || value === "") return null;
      return value as BotActionAttribute;
    });
}

const botActionDamageSchema = z.object({
  numberOfDice: z.number().int().min(0, "Damage dice must be at least 0"),
  diceType: z.number().int().min(1, "Damage dice type must be at least 1"),
  damageType: weaponDamageTypeSchema,
  attribute: botActionAttributeField("The damage attribute"),
});

export const botActionSchema = z.object({
  name: z.string().trim().min(1, "A bot action needs a name"),
  description: z
    .string()
    .nullish()
    .transform((value) => blankToNull(value)),
  notes: z
    .string()
    .nullish()
    .transform((value) => blankToNull(value)),
  numberOfDice: z.number().int().min(0, "Number of dice must be at least 0"),
  attribute: botActionAttributeField("The action attribute"),
  damage: botActionDamageSchema.nullish().transform((value) => value ?? null),
});

export type BotAction = z.output<typeof botActionSchema>;

export const botActionRollSchema = z.object({
  index: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  notes: z.string().nullable(),
  numberOfDice: z.number().int(),
  attribute: z.enum(BOT_ACTION_ATTRIBUTES).nullable(),
  toHitPool: z.number().int(),
  mayRoll: z.boolean(),
  rollBlockedReason: z
    .enum(["BROKEN", "BEYOND_REPAIR", "BATTERY_EMPTY"])
    .nullable(),
  damage: z
    .object({
      numberOfDice: z.number().int(),
      diceType: z.number().int(),
      damageType: weaponDamageTypeSchema,
      attribute: z.enum(BOT_ACTION_ATTRIBUTES).nullable(),
      pool: z.number().int(),
    })
    .nullable(),
});

export type BotActionRoll = z.infer<typeof botActionRollSchema>;

import { z } from "zod";

const rollTypeSchema = z.enum([
  "GENERAL_ROLL",
  "ATTACK",
  "ATTACK_DAMAGE",
  "DEFENCE",
  "GRID_DEFENCE",
  "ITEM_DAMAGE",
  "INITIATIVE",
]);

export const rollEventPayloadSchema = z
  .object({
    characterId: z.string().optional(),
    /** When true, Discord output omits character name + roll tag details. */
    isPrivate: z.boolean().optional(),
    rollType: rollTypeSchema,
    diceExpression: z.string().max(120).optional(),
    results: z.array(z.number().int().min(1)).min(1),
    total: z.number().int().optional(),
    metadata: z.record(z.unknown()).optional(),
    /** Holding the roll is for. Present only on a bot roll. */
    botCharacterId: z.string().min(1).optional(),
    /** One bot attribute. Battery is refused by the handler. */
    botAttribute: z.string().min(1).optional(),
    /** Attack Melee, Attack Range, Defence Melee, Defence Range, or Defence GRID. */
    botCombat: z.string().min(1).optional(),
    /** Bot-equipped hand weapon. Absent for Unarmed or Improvised weapon. */
    botWeaponItemCharacterId: z.string().min(1).optional(),
    /** One action on the bot's own list. */
    botAction: z
      .object({
        list: z.enum(["actions", "additionalActions"]),
        index: z.number().int().nonnegative(),
      })
      .optional(),
    /** One action stored on an item installed on the holding. */
    botItemAction: z
      .object({
        itemCharacterId: z.string().min(1),
        index: z.number().int().nonnegative(),
      })
      .optional(),
    /** Faces for the damage block. Absent when the action has no damage. */
    damageResults: z.array(z.number().int().min(1)).optional(),
    /** Added to the floored attribute pool. Any integer, including negative. */
    extraDice: z.number().int().optional(),
  })
  .strict();

export type RollEventPayload = z.infer<typeof rollEventPayloadSchema>;

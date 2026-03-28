import { z } from "zod";

export const rollTypeSchema = z.enum([
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
    rollType: rollTypeSchema,
    diceExpression: z.string().max(120).optional(),
    results: z.array(z.number().int().min(1)).min(1),
    total: z.number().int().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export type RollEventPayload = z.infer<typeof rollEventPayloadSchema>;

import { z } from "zod";

const submitCharacterInitiativeSchema = z.object({
  combatantType: z.literal("CHARACTER"),
  combatantId: z.string().min(1),
  combatantName: z.string().trim().min(1).optional(),
  rolledValue: z.number().int(),
  initiativeModifier: z.number().int(),
});

const submitEnemyInitiativeSchema = z.object({
  combatantType: z.literal("ENEMY"),
  combatantId: z.string().min(1),
  combatantName: z.string().trim().min(1),
  rolledValue: z.number().int(),
  initiativeModifier: z.number().int(),
});

const submitBotInitiativeSchema = z
  .object({
    combatantType: z.literal("BOT"),
    combatantId: z.string().min(1),
    rolledValue: z.number().int().min(1).max(10),
    extraDice: z.number().int().optional(),
  })
  .strict();

export const submitInitiativeBodySchema = z.union([
  submitCharacterInitiativeSchema,
  submitEnemyInitiativeSchema,
  submitBotInitiativeSchema,
]);

export const adjustInitiativeBodySchema = z.object({
  initiativeDelta: z
    .number()
    .int("initiativeDelta must be an integer")
    .refine((value) => value !== 0, "initiativeDelta cannot be 0"),
});

export type SubmitInitiativeBody = z.infer<typeof submitInitiativeBodySchema>;

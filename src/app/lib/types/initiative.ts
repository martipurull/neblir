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

export const submitInitiativeBodySchema = z
  .union([submitCharacterInitiativeSchema, submitEnemyInitiativeSchema])
  .transform((input) => input);

export const adjustInitiativeBodySchema = z.object({
  initiativeDelta: z
    .number()
    .int("initiativeDelta must be an integer")
    .refine((value) => value !== 0, "initiativeDelta cannot be 0"),
});

export type SubmitInitiativeBody = z.infer<typeof submitInitiativeBodySchema>;
export type AdjustInitiativeBody = z.infer<typeof adjustInitiativeBodySchema>;

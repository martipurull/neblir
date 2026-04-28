import { z } from "zod";

export const submitInitiativeBodySchema = z.object({
  characterId: z.string().min(1),
  rolledValue: z.number().int(),
  initiativeModifier: z.number().int(),
});

export const adjustInitiativeBodySchema = z.object({
  initiativeDelta: z
    .number()
    .int("initiativeDelta must be an integer")
    .refine((value) => value !== 0, "initiativeDelta cannot be 0"),
});

export type SubmitInitiativeBody = z.infer<typeof submitInitiativeBodySchema>;
export type AdjustInitiativeBody = z.infer<typeof adjustInitiativeBodySchema>;

import { z } from "zod";

export const submitInitiativeBodySchema = z.object({
  characterId: z.string().min(1),
  rolledValue: z.number().int(),
  initiativeModifier: z.number().int(),
});

export type SubmitInitiativeBody = z.infer<typeof submitInitiativeBodySchema>;

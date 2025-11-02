import { z } from "zod";

export const gameSchema = z.object({
  name: z.string(),
  gameMaster: z.string(),
  imageKey: z.string().optional(),
});

export const gameUpdateSchema = gameSchema.partial().strict();

export type Game = z.infer<typeof gameSchema>;

export const gameUserSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  userId: z.string(),
});

export const gameCharacterSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  characterId: z.string(),
});

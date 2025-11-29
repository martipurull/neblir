import { z } from "zod";

// Base schema for create/update operations (without relations)
const gameBaseSchema = z.object({
  name: z.string(),
  gameMaster: z.string(),
  imageKey: z.string().optional(),
});

// Full schema for reading (with relations)
export const gameSchema = gameBaseSchema.extend({
  users: z.array(z.lazy(() => gameUserSchema)).optional(),
  characters: z.array(z.lazy(() => gameCharacterSchema)).optional(),
});

export const gameCreateSchema = gameBaseSchema.strict();
export const gameUpdateSchema = gameBaseSchema.partial().strict();

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

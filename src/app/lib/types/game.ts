import { z } from "zod";

// Base schema for create/update operations (without relations)
const gameBaseSchema = z.object({
  name: z.string(),
  imageKey: z.string().optional(),
});

// Full schema for reading (with relations)
export const gameSchema = gameBaseSchema.extend({
  gameMaster: z.string(),
  users: z.array(z.lazy(() => gameUserSchema)).optional(),
  characters: z.array(z.lazy(() => gameCharacterSchema)).optional(),
});

export const gameCreateSchema = gameBaseSchema.strict();
export const gameUpdateSchema = gameBaseSchema
  .extend({
    nextSession: z.coerce.date().nullable().optional(),
    lore: z.string().nullable().optional(),
  })
  .partial()
  .strict();

export type Game = z.infer<typeof gameSchema>;

export const gameUserSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  userId: z.string(),
});

/** GameUser as returned from GET /api/games (with linked user for display). */
export const gameListUserSchema = gameUserSchema.extend({
  user: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export const gameListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageKey: z.string().nullable().optional(),
  gameMaster: z.string(),
  users: z.array(gameListUserSchema),
});

export type GameListItem = z.infer<typeof gameListItemSchema>;

export const gameCharacterSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  characterId: z.string(),
});

/** Character summary as included in game detail. */
export const gameDetailCharacterSchema = gameCharacterSchema.extend({
  character: z.object({
    id: z.string(),
    name: z.string(),
    surname: z.string().nullable().optional(),
    avatarKey: z.string().nullable().optional(),
  }),
});

/** Custom item summary for game detail. */
export const gameDetailCustomItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});

/** Full game detail as returned by GET /api/games/[id]. */
export const gameDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageKey: z.string().nullable().optional(),
  gameMaster: z.string(),
  isGameMaster: z.boolean().optional(),
  nextSession: z.coerce.date().nullable().optional(),
  lore: z.string().nullable().optional(),
  users: z.array(gameListUserSchema),
  characters: z.array(gameDetailCharacterSchema).optional(),
  customItems: z.array(gameDetailCustomItemSchema).optional(),
});

export type GameDetail = z.infer<typeof gameDetailSchema>;

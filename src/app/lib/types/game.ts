import { Race, Religion } from "@prisma/client";
import { z } from "zod";
import { discordIntegrationSchema } from "./discord";

// Base schema for create/update operations (without relations)
const gameBaseSchema = z.object({
  name: z.string(),
  premise: z.string().optional(),
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
  premise: z.string().nullable().optional(),
  imageKey: z.string().nullable().optional(),
  gameMaster: z.string(),
  users: z.array(gameListUserSchema),
});
export const gameListSchema = z.array(gameListItemSchema);

export type GameListItem = z.infer<typeof gameListItemSchema>;

/** Minimal response expected from POST /api/games */
export const gameCreateResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  premise: z.string().nullable().optional(),
  imageKey: z.string().nullable().optional(),
  gameMaster: z.string(),
});
export type GameCreateResponse = z.infer<typeof gameCreateResponseSchema>;

export const gameCharacterSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  characterId: z.string(),
  isPublic: z.boolean().optional(),
});

/** POST /api/games/[id]/characters — link existing characters to the game. */
export const gameCharactersAddSchema = z
  .object({
    characterIds: z.array(z.string()).optional(),
    characters: z
      .array(
        z.object({
          characterId: z.string().min(1),
          isPublic: z.boolean().optional(),
        })
      )
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (
      (!val.characterIds || val.characterIds.length === 0) &&
      (!val.characters || val.characters.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one character to link.",
      });
    }
  });

/** DELETE /api/games/[id]/characters — unlink a character. */
export const gameCharacterRemoveSchema = z.object({
  characterId: z.string().min(1),
});

/** PATCH /api/games/[id]/characters — update visibility for a linked character. */
export const gameCharacterVisibilityUpdateSchema = z.object({
  characterId: z.string().min(1),
  isPublic: z.boolean(),
});

/** GameCharacter as returned from GET /api/characters/[id] (includes game name). */
export const gameCharacterWithGameSchema = gameCharacterSchema.extend({
  game: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

/** Full general information for display (e.g. non-owned characters in game). */
const gameDetailGeneralInformationSchema = z.object({
  name: z.string(),
  surname: z.string(),
  age: z.number(),
  religion: z.nativeEnum(Religion),
  profession: z.string(),
  race: z.nativeEnum(Race),
  birthplace: z.string(),
  /** TipTap rich text stored as HTML string */
  backstory: z.string().nullable().optional(),
  /** TipTap rich text stored as HTML string */
  summary: z.string().nullable().optional(),
  level: z.number(),
  avatarKey: z.string().nullable().optional(),
  height: z.number(),
  weight: z.number(),
});

/** Character summary as included in game detail. */
export const gameDetailCharacterSchema = gameCharacterSchema.extend({
  character: z.object({
    id: z.string(),
    name: z.string(),
    surname: z.string().nullable().optional(),
    avatarKey: z.string().nullable().optional(),
    isOwnedByCurrentUser: z.boolean(),
    /** Present for non-owned characters (for display). */
    generalInformation: gameDetailGeneralInformationSchema.optional(),
    initiativeMod: z.number().optional(),
    /** CharacterUser links; used e.g. to detect GM-controlled characters. */
    linkedUserIds: z.array(z.string()).optional(),
  }),
});

/** Custom item summary for game detail. */
export const gameDetailCustomItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  description: z.string().nullable().optional(),
  imageKey: z.string().nullable().optional(),
});

export const gameDetailCustomEnemySchema = z.object({
  id: z.string(),
  name: z.string(),
  initiativeModifier: z.number(),
  numberOfReactions: z.number().optional(),
  imageKey: z.string().nullable().optional(),
  health: z.number().optional(),
  speed: z.number().optional(),
});

export const gameDetailEnemyInstanceSchema = z.object({
  id: z.string(),
  sourceCustomEnemyId: z.string().nullable().optional(),
  sourceOfficialEnemyId: z.string().nullable().optional(),
  name: z.string(),
  imageKey: z.string().nullable().optional(),
  maxHealth: z.number(),
  currentHealth: z.number(),
  speed: z.number(),
  initiativeModifier: z.number(),
  reactionsPerRound: z.number(),
  reactionsRemaining: z.number(),
  status: z.enum(["ACTIVE", "DEFEATED", "DEAD"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Initiative line as returned from GET/PATCH/POST/DELETE game detail responses (sorted). */
export const gameDetailInitiativeEntrySchema = z.object({
  combatantType: z.enum(["CHARACTER", "ENEMY"]),
  combatantId: z.string(),
  combatantName: z.string(),
  rolledValue: z.number(),
  initiativeModifier: z.number(),
  submittedAt: z.coerce.date(),
  totalInitiative: z.number(),
  displayName: z.string().nullable().optional(),
  displaySurname: z.string().nullable().optional(),
});

/** Full game detail as returned by GET /api/games/[id]. */
export const gameDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  premise: z.string().nullable().optional(),
  imageKey: z.string().nullable().optional(),
  gameMaster: z.string(),
  isGameMaster: z.boolean().optional(),
  nextSession: z.coerce.date().nullable().optional(),
  lore: z.string().nullable().optional(),
  users: z.array(gameListUserSchema),
  characters: z.array(gameDetailCharacterSchema).optional(),
  customItems: z.array(gameDetailCustomItemSchema).optional(),
  customEnemies: z.array(gameDetailCustomEnemySchema).optional(),
  enemyInstances: z.array(gameDetailEnemyInstanceSchema).optional(),
  initiativeOrder: z.array(gameDetailInitiativeEntrySchema).optional(),
  discordIntegration: discordIntegrationSchema.nullable().optional(),
});

export type GameDetail = z.infer<typeof gameDetailSchema>;

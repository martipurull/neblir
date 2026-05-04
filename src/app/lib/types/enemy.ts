import { z } from "zod";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";

/** Optional fields accept `null` (e.g. JSON / DB) as well as omitted; output uses `undefined` for unset. */
export const enemyActionSchema = z.object({
  name: z.string().trim().min(1),
  description: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  numberOfDiceToHit: z
    .number()
    .int()
    .positive()
    .nullish()
    .transform((v) => v ?? undefined),
  numberOfDamageDice: z
    .number()
    .int()
    .positive()
    .nullish()
    .transform((v) => v ?? undefined),
  damageDiceType: z
    .number()
    .int()
    .positive()
    .nullish()
    .transform((v) => v ?? undefined),
  damageType: weaponDamageTypeSchema.nullish().transform((v) => v ?? undefined),
  notes: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
});

const nullToUndefined = (v: unknown) => (v === null ? undefined : v);

export const enemyBaseSchema = z.object({
  name: z.string().trim().min(1),
  description: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  imageKey: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  health: z.number().int().nonnegative(),
  speed: z.number().int().nonnegative(),
  initiativeModifier: z.number().int(),
  numberOfReactions: z.number().int().nonnegative(),
  /** Omitted values default to 0, matching Prisma `@default(0)` on Enemy / CustomEnemy. */
  defenceMelee: z.preprocess(
    nullToUndefined,
    z.number().int().optional().default(0)
  ),
  defenceRange: z.preprocess(
    nullToUndefined,
    z.number().int().optional().default(0)
  ),
  defenceGrid: z.preprocess(
    nullToUndefined,
    z.number().int().optional().default(0)
  ),
  attackMelee: z.preprocess(
    nullToUndefined,
    z.number().int().optional().default(0)
  ),
  attackRange: z.preprocess(
    nullToUndefined,
    z.number().int().optional().default(0)
  ),
  attackThrow: z.preprocess(
    nullToUndefined,
    z.number().int().optional().default(0)
  ),
  attackGrid: z.preprocess(
    nullToUndefined,
    z.number().int().optional().default(0)
  ),
  immunities: z.array(weaponDamageTypeSchema).default([]),
  resistances: z.array(weaponDamageTypeSchema).default([]),
  vulnerabilities: z.array(weaponDamageTypeSchema).default([]),
  actions: z.array(enemyActionSchema).default([]),
  additionalActions: z.array(enemyActionSchema).default([]),
  notes: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
});

export const enemyCreateSchema = enemyBaseSchema;
export type EnemyCreate = z.infer<typeof enemyCreateSchema>;

export const customEnemyCreateSchema = enemyBaseSchema.extend({
  gameId: z.string(),
});
export type CustomEnemyCreate = z.infer<typeof customEnemyCreateSchema>;

/** POST /api/games/[id]/custom-enemies — body; `gameId` comes from the URL. */
export const customEnemyCreateBodySchema = customEnemyCreateSchema.omit({
  gameId: true,
});

export const customEnemyUpdateSchema = customEnemyCreateSchema
  .omit({ gameId: true })
  .partial();
export type CustomEnemyUpdate = z.infer<typeof customEnemyUpdateSchema>;

export const enemyResponseSchema = enemyBaseSchema.extend({
  id: z.string(),
});
export const enemyListResponseSchema = z.array(enemyResponseSchema);
export type EnemyResponse = z.infer<typeof enemyResponseSchema>;

export const customEnemyResponseSchema = enemyResponseSchema.extend({
  gameId: z.string(),
});
export const customEnemyListResponseSchema = z.array(customEnemyResponseSchema);
export type CustomEnemyResponse = z.infer<typeof customEnemyResponseSchema>;

/** POST /api/games/[id]/custom-enemies/copy */
export const customEnemyCopyBodySchema = z.object({
  sourceGameId: z.string().min(1),
  sourceCustomEnemyId: z.string().min(1),
});

/** POST /api/games/[id]/custom-enemies/from-official */
export const customEnemyFromOfficialBodySchema = z.object({
  enemyId: z.string().min(1),
});

/** POST /api/games/[id]/enemy-instances */
export const enemyInstanceSpawnBodySchema = z
  .object({
    sourceCustomEnemyId: z.string().min(1).optional(),
    sourceOfficialEnemyId: z.string().min(1).optional(),
    count: z.number().int().min(1).max(50).optional(),
    nameOverride: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    const hasCustom = Boolean(data.sourceCustomEnemyId?.trim());
    const hasOfficial = Boolean(data.sourceOfficialEnemyId?.trim());
    if (hasCustom === hasOfficial) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Specify exactly one of sourceCustomEnemyId or sourceOfficialEnemyId",
        path: hasCustom ? ["sourceOfficialEnemyId"] : ["sourceCustomEnemyId"],
      });
    }
  });

/** PATCH /api/games/[id]/enemy-instances/[instanceId] */
export const enemyInstancePatchBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  notes: z.string().optional(),
  imageKey: z.string().min(1).nullable().optional(),
  currentHealth: z.number().int().nonnegative().optional(),
  maxHealth: z.number().int().min(1).optional(),
  speed: z.number().int().min(0).optional(),
  initiativeModifier: z.number().int().optional(),
  reactionsPerRound: z.number().int().min(0).optional(),
  reactionsRemaining: z.number().int().nonnegative().optional(),
  status: z.enum(["ACTIVE", "DEFEATED", "DEAD"]).optional(),
});

import { z } from "zod";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";

/** Optional fields accept `null` (e.g. JSON / DB) as well as omitted; output uses `undefined` for unset. */
export const enemyActionSchema = z.object({
  name: z.string().trim().min(1),
  description: z
    .string()
    .nullish()
    .transform((v) => (v == null ? undefined : v)),
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
    .transform((v) => (v == null ? undefined : v)),
});

const nullToUndefined = (v: unknown) => (v === null ? undefined : v);

export const enemyBaseSchema = z.object({
  name: z.string().trim().min(1),
  description: z
    .string()
    .nullish()
    .transform((v) => (v == null ? undefined : v)),
  imageKey: z
    .string()
    .nullish()
    .transform((v) => (v == null ? undefined : v)),
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
    .transform((v) => (v == null ? undefined : v)),
});

export const enemyCreateSchema = enemyBaseSchema;
export type EnemyCreate = z.infer<typeof enemyCreateSchema>;

export const customEnemyCreateSchema = enemyBaseSchema.extend({
  gameId: z.string(),
});
export type CustomEnemyCreate = z.infer<typeof customEnemyCreateSchema>;

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

import { z } from "zod";
import { enemyActionSchema } from "@/app/lib/types/enemy";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";

const enemyInstanceStatusSchema = z.enum(["ACTIVE", "DEFEATED", "DEAD"]);

export type EnemyInstancePatch = {
  name?: string;
  description?: string | null;
  notes?: string;
  imageKey?: string | null;
  isPublic?: boolean;
  currentHealth?: number;
  maxHealth?: number;
  speed?: number;
  initiativeModifier?: number;
  reactionsPerRound?: number;
  reactionsRemaining?: number;
  status?: z.infer<typeof enemyInstanceStatusSchema>;
};

export const enemyInstanceDetailResponseSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  instanceNumber: z.number().int().nullable().optional(),
  sourceName: z.string().nullable().optional(),
  renamed: z.boolean().optional(),
  numberVisible: z.boolean().optional(),
  instanceLabel: z.string().optional(),
  isPublic: z.boolean().optional(),
  imageKey: z.string().nullable().optional(),
  currentHealth: z.number(),
  maxHealth: z.number(),
  reactionsRemaining: z.number(),
  reactionsPerRound: z.number(),
  status: enemyInstanceStatusSchema,
  speed: z.number(),
  initiativeModifier: z.number(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  defenceMelee: z.number(),
  defenceRange: z.number(),
  defenceGrid: z.number(),
  attackMelee: z.number(),
  attackRange: z.number(),
  attackThrow: z.number(),
  attackGrid: z.number(),
  immunities: z.array(weaponDamageTypeSchema),
  resistances: z.array(weaponDamageTypeSchema),
  vulnerabilities: z.array(weaponDamageTypeSchema),
  actions: z.array(enemyActionSchema),
  additionalActions: z.array(enemyActionSchema),
});

export type EnemyInstanceDetailResponse = z.infer<
  typeof enemyInstanceDetailResponseSchema
>;

export type SpawnEnemyInstancesBody =
  | {
      sourceCustomEnemyId: string;
      count?: number;
      nameOverride?: string;
      isPublic?: boolean;
      sourceOfficialEnemyId?: undefined;
    }
  | {
      sourceOfficialEnemyId: string;
      count?: number;
      nameOverride?: string;
      isPublic?: boolean;
      sourceCustomEnemyId?: undefined;
    };

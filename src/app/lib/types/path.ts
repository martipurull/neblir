import { PathName } from "@prisma/client";
import { z } from "zod";
import { itemResponseSchema } from "./item";

export const pathName = z.nativeEnum(PathName);

/** Catalogue weapon shown on a Soldier path (display-only reminder). */
const soldierFavouriteWeaponSchema = itemResponseSchema
  .pick({
    id: true,
    name: true,
    description: true,
    imageKey: true,
    type: true,
  })
  .extend({
    type: z.literal("WEAPON"),
  });

export type SoldierFavouriteWeapon = z.infer<
  typeof soldierFavouriteWeaponSchema
>;

export const soldierFavouriteWeaponUpdateSchema = z
  .object({
    pathId: z.string().min(1),
    favouriteWeaponItemId: z.string().min(1).nullable(),
  })
  .strict();

export type SoldierFavouriteWeaponUpdate = z.infer<
  typeof soldierFavouriteWeaponUpdateSchema
>;

export const featureSchema = z.object({
  id: z.string(),
  featureId: z.string(),
  characterId: z.string(),
  grade: z.number().min(1),
  feature: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    minPathRank: z.number().min(1),
    maxGrade: z.number().min(1).max(6),
    examples: z.array(z.string()).optional().nullable(),
    applicablePaths: z.array(pathName),
  }),
});

export const pathCreateSchema = z
  .object({
    name: pathName,
    description: z.string().nullish(),
    baseFeature: z.string().min(1),
  })
  .strict();

export type PathCreate = z.infer<typeof pathCreateSchema>;

export const pathSchema = z.object({
  id: z.string(),
  name: pathName,
  description: z.string().nullish(),
  baseFeature: z.string(),
  /** Present when path is loaded on a character (PathCharacter.rank). */
  rank: z.number().optional(),
  /** PathCharacter row id (for Soldier favourite-weapon updates). */
  pathCharacterId: z.string().optional(),
  favouriteWeaponItemId: z.string().nullish().optional(),
  favouriteWeapon: soldierFavouriteWeaponSchema.nullish().optional(),
});

/** PATCH /api/paths/[id] (super-admin official catalogue). */
export const pathCatalogueUpdateSchema = pathCreateSchema.partial().strict();

export type Path = z.infer<typeof pathSchema>;

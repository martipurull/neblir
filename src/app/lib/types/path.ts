import { PathName } from "@prisma/client";
import { z } from "zod";

export const pathName = z.nativeEnum(PathName);

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

export const featureUpdateSchema = featureSchema.partial().strict();

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
});

export const pathUpdateSchema = pathSchema.partial().strict();

/** PATCH /api/paths/[id] (super-admin official catalogue). */
export const pathCatalogueUpdateSchema = pathCreateSchema.partial().strict();

export type Path = z.infer<typeof pathSchema>;

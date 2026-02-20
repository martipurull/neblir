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
    description: z.string(),
    minPathRank: z.number().min(1),
    maxGrade: z.number().min(1).max(4),
    examples: z.array(z.string()).optional().nullable(),
    applicablePaths: z.array(pathName),
  }),
});

export const featureUpdateSchema = featureSchema.partial().strict();

export const pathSchema = z.object({
  id: z.string(),
  pathId: z.string(),
  characterId: z.string(),
  rank: z.number().min(1),
  path: z.object({
    id: z.string(),
    name: pathName,
    baseFeature: z.string(),
    description: z.string().nullish(),
  }),
});

export const pathUpdateSchema = pathSchema.partial().strict();

export type Path = z.infer<typeof pathSchema>;

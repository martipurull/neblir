import { PathName } from "@prisma/client";
import { z } from "zod";

export const pathName = z.nativeEnum(PathName);

export const featureSchema = z.object({
  minPathRank: z.number().min(1),
  maxGrade: z.number().min(1).max(4),
  name: z.string(),
  description: z.string(),
  applicablePaths: z.array(pathName),
  examples: z.array(z.string()).optional().nullable(),
});

export const featureUpdateSchema = featureSchema.partial().strict();

export const pathSchema = z.object({
  name: pathName,
  baseFeature: z.string(),
  description: z.string().nullish(),
});

export const pathUpdateSchema = pathSchema.partial().strict();

export type Path = z.infer<typeof pathSchema>;

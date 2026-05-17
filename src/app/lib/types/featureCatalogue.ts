import { z } from "zod";
import { pathName } from "./path";

/** Body for POST /api/features (official catalogue; super-admin only). */
export const featureCatalogueCreateSchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    minPathRank: z.number().int().min(1),
    maxGrade: z.number().int().min(1).max(6),
    examples: z.array(z.string()).default([]),
    /** Path enum values; `PathFeature` rows are synced from these. */
    applicablePaths: z.array(pathName).min(1),
  })
  .strict();

export const featureCatalogueUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    minPathRank: z.number().int().min(1).optional(),
    maxGrade: z.number().int().min(1).max(6).optional(),
    examples: z.array(z.string()).optional(),
    applicablePaths: z.array(pathName).optional(),
  })
  .strict();

export type FeatureCatalogueCreate = z.infer<
  typeof featureCatalogueCreateSchema
>;
export type FeatureCatalogueUpdate = z.infer<
  typeof featureCatalogueUpdateSchema
>;

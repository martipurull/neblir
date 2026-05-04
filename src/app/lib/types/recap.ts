import { z } from "zod";

const nullableStringSchema = z.string().nullable().optional();

export const gameRecapSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  title: z.string().min(1),
  summary: nullableStringSchema,
  fileKey: z.string().min(1),
  fileName: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative(),
  uploadedByUserId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const gameRecapListSchema = z.array(gameRecapSchema);

export const gameRecapCreateSchema = z
  .object({
    title: z.string().min(1),
    summary: nullableStringSchema,
    fileKey: z.string().min(1),
    fileName: z.string().min(1),
    fileSizeBytes: z.number().int().positive(),
  })
  .strict();

export const gameRecapDownloadSchema = z.object({
  url: z.string().url(),
});

export type GameRecap = z.infer<typeof gameRecapSchema>;
export type GameRecapCreate = z.infer<typeof gameRecapCreateSchema>;

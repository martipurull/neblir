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
  thumbnailKey: z.string().min(1).nullable().optional(),
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
    thumbnailKey: z.string().min(1).nullable().optional(),
  })
  .strict();

export const gameRecapUpdateSchema = z
  .object({
    title: z.string().min(1),
    summary: nullableStringSchema,
    fileKey: z.string().min(1).optional(),
    fileName: z.string().min(1).optional(),
    fileSizeBytes: z.number().int().positive().optional(),
    thumbnailKey: z.string().min(1).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasAnyFileField =
      data.fileKey != null ||
      data.fileName != null ||
      data.fileSizeBytes != null;
    const hasAllFileFields =
      data.fileKey != null &&
      data.fileName != null &&
      data.fileSizeBytes != null;
    if (hasAnyFileField && !hasAllFileFields) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "fileKey, fileName, and fileSizeBytes must all be provided together",
      });
    }
  });

export const gameRecapDownloadSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
});

export const recapUploadUrlRequestSchema = z
  .object({
    gameId: z.string().min(1),
    fileName: z.string().min(1),
    fileSizeBytes: z.number().int().positive(),
  })
  .strict();

export const recapUploadUrlResponseSchema = z.object({
  fileKey: z.string().min(1),
  uploadUrl: z.string().url(),
  thumbnailFileKey: z.string().min(1).optional(),
  thumbnailUploadUrl: z.string().url().optional(),
});

export type GameRecap = z.infer<typeof gameRecapSchema>;
export type GameRecapCreate = z.infer<typeof gameRecapCreateSchema>;
export type GameRecapUpdate = z.infer<typeof gameRecapUpdateSchema>;
export type RecapUploadUrlRequest = z.infer<typeof recapUploadUrlRequestSchema>;

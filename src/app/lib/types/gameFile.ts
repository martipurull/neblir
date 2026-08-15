import { z } from "zod";

const nullableStringSchema = z.string().nullable().optional();

const gameFileKindSchema = z.enum(["IMAGE", "PDF"]);

export const gameFileSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  title: z.string().min(1),
  description: nullableStringSchema,
  kind: gameFileKindSchema,
  fileKey: z.string().min(1),
  fileName: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative(),
  uploadedByUserId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const gameFileListSchema = z.array(gameFileSchema);

export const gameFileCreateSchema = z
  .object({
    title: z.string().min(1),
    description: nullableStringSchema,
    kind: gameFileKindSchema,
    fileKey: z.string().min(1),
    fileName: z.string().min(1),
    fileSizeBytes: z.number().int().positive(),
  })
  .strict();

export const gameFileDownloadSchema = z.object({
  url: z.string().url(),
});

export const gameFileUploadUrlRequestSchema = z
  .object({
    gameId: z.string().min(1),
    fileName: z.string().min(1),
    fileSizeBytes: z.number().int().positive(),
    kind: z.literal("PDF"),
  })
  .strict();

export const gameFileUploadUrlResponseSchema = z.object({
  fileKey: z.string().min(1),
  uploadUrl: z.string().url(),
});

export type GameFile = z.infer<typeof gameFileSchema>;
export type GameFileCreate = z.infer<typeof gameFileCreateSchema>;
export type GameFileUploadUrlRequest = z.infer<
  typeof gameFileUploadUrlRequestSchema
>;

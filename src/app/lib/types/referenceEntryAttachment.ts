import { z } from "zod";

export const referenceEntryAttachmentSchema = z.object({
  id: z.string(),
  referenceEntryId: z.string(),
  fileKey: z.string().min(1),
  fileName: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative(),
  uploadedByUserId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const referenceEntryAttachmentListSchema = z.array(
  referenceEntryAttachmentSchema
);

export const referenceEntryAttachmentCreateSchema = z
  .object({
    fileKey: z.string().min(1),
    fileName: z.string().min(1),
    fileSizeBytes: z.number().int().positive(),
  })
  .strict();

export const loreAttachmentUploadUrlRequestSchema = z
  .object({
    gameId: z.string().min(1).optional(),
    referenceEntryId: z.string().min(1).optional(),
    fileName: z.string().min(1),
    fileSizeBytes: z.number().int().positive(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.gameId && !data.referenceEntryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "gameId or referenceEntryId is required",
      });
    }
  });

export const loreAttachmentUploadUrlResponseSchema = z.object({
  fileKey: z.string().min(1),
  uploadUrl: z.string().url(),
});

export const loreAttachmentDownloadSchema = z.object({
  url: z.string().url(),
});

export type ReferenceEntryAttachment = z.infer<
  typeof referenceEntryAttachmentSchema
>;
export type ReferenceEntryAttachmentCreate = z.infer<
  typeof referenceEntryAttachmentCreateSchema
>;
export type LoreAttachmentUploadUrlRequest = z.infer<
  typeof loreAttachmentUploadUrlRequestSchema
>;

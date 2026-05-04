import { z } from "zod";

const nullableStringSchema = z.string().nullable().optional();

export const gameImageSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  title: z.string().min(1),
  description: nullableStringSchema,
  imageKey: z.string().min(1),
  uploadedByUserId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const gameImageListSchema = z.array(gameImageSchema);

export const gameImageCreateSchema = z
  .object({
    title: z.string().min(1),
    description: nullableStringSchema,
    imageKey: z.string().min(1),
  })
  .strict();

export type GameImage = z.infer<typeof gameImageSchema>;
export type GameImageCreate = z.infer<typeof gameImageCreateSchema>;

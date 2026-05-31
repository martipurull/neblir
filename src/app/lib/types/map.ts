import { z } from "zod";

const mapMutableSchema = z.object({
  name: z.string().min(1),
  imageKey: z.string().min(1),
  description: z.string().nullable().optional(),
  gameId: z.string().nullable().optional(),
});

const mapSchema = mapMutableSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date().nullable().optional(),
  updatedAt: z.coerce.date().nullable().optional(),
});

export const mapCreateSchema = mapMutableSchema.strict();
export const mapUpdateSchema = mapMutableSchema.partial().strict();
export const mapListSchema = z.array(mapSchema);

export type GameMap = z.infer<typeof mapSchema>;

import { z } from "zod";

/** Signed URL returned by GET /api/image-url. */
export const imageUrlResponseSchema = z.object({
  url: z.string().min(1),
});

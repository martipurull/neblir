import { z } from "zod";
import { characterSectionOrderSchema } from "@/app/lib/constants/characterSections";
import { gameUserSchema } from "./game";

const characterLayoutModeSchema = z.enum(["horizontal", "vertical"]).nullish();
export type CharacterLayoutMode = NonNullable<
  z.infer<typeof characterLayoutModeSchema>
>;

const characterCarouselWrapSchema = z.boolean().nullish();

const characterUserSchema = z.object({
  id: z.string(),
  characterId: z.string(),
  userId: z.string(),
});

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  characterLayoutMode: characterLayoutModeSchema,
  characterCarouselWrap: characterCarouselWrapSchema,
  characterSectionOrder: characterSectionOrderSchema,
  games: z.array(z.lazy(() => gameUserSchema)).optional(),
  characters: z.array(z.lazy(() => characterUserSchema)).optional(),
});

export const userCreateSchema = userSchema
  .omit({ id: true, characters: true, games: true })
  .strict();

export const userUpdateSchema = userCreateSchema.partial().strict();

export const currentUserSchema = userSchema
  .pick({
    id: true,
    name: true,
    email: true,
    characterLayoutMode: true,
    characterCarouselWrap: true,
    characterSectionOrder: true,
  })
  .extend({
    isSuperAdmin: z.boolean(),
  });
export type CurrentUser = z.infer<typeof currentUserSchema>;

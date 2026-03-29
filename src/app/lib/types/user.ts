import { z } from "zod";
import { gameUserSchema } from "./game";

const characterUserSchema = z.object({
  id: z.string(),
  characterId: z.string(),
  userId: z.string(),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  games: z.array(z.lazy(() => gameUserSchema)).optional(),
  characters: z.array(z.lazy(() => characterUserSchema)).optional(),
});

export const userCreateSchema = userSchema
  .omit({ id: true, characters: true, games: true })
  .strict();

export const userUpdateSchema = userCreateSchema.partial().strict();

export const usersSchema = z.array(userSchema);

export type User = z.infer<typeof userSchema>;
export const currentUserSchema = userSchema.pick({
  name: true,
  email: true,
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

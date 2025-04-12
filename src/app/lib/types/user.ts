import { z } from "zod";
import { gameUserSchema } from "./game";

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    games: z.array(gameUserSchema).optional(),
    characters: z.array(z.string()).optional(),
})

export const userCreateSchema = userSchema.omit({ id: true, games: true, characters: true }).strict()

export const userUpdateSchema = userSchema.partial().strict()

export const usersSchema = z.array(userSchema)

export type User = z.infer<typeof userSchema>
import { z } from "zod";

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
})

export const userCreateSchema = userSchema.omit({ id: true })

export const userUpdateSchema = userSchema.partial().strict()

export const usersSchema = z.array(userSchema)

export type User = z.infer<typeof userSchema>
import { z } from "zod";

const playerSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    games: z.array(z.string()).optional(),
    characters: z.array(z.string()).optional(),
})

export const playersSchema = z.array(playerSchema)

export type Player = z.infer<typeof playerSchema>
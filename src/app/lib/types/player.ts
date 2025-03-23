import { z } from "zod";

const playerSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
})

export const playersSchema = z.array(playerSchema)

export type Player = z.infer<typeof playerSchema>
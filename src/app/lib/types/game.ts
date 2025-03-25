import { z } from "zod";
import { userSchema } from "./user";

export const gameSchema = z.object({
    name: z.string(),
    gameMaster: z.string(),
    users: z.array(userSchema),
    imageKey: z.string().optional()
})

export type Game = z.infer<typeof gameSchema>
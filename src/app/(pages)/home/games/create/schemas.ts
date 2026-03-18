import { gameCreateSchema } from "@/app/lib/types/game";
import { z } from "zod";

/** Form schema for create game (name, premise, imageKey from upload). */
export const createGameFormSchema = z.object({
  game: gameCreateSchema,
});

export type CreateGameFormValues = z.infer<typeof createGameFormSchema>;

export const defaultCreateGameFormValues: CreateGameFormValues = {
  game: {
    name: "",
    premise: "",
  },
};

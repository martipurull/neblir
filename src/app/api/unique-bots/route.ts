import { getGame } from "@/app/lib/prisma/game";
import { getBot } from "@/app/lib/prisma/bot";
import { getCustomBot } from "@/app/lib/prisma/customBot";
import {
  createUniqueBot,
  uniqueBotCreateDataFromParsed,
} from "@/app/lib/prisma/uniqueBot";
import { uniqueBotCreateSchema } from "@/app/lib/types/bot";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

/** Mint a Unique bot for a game without attaching it to a character. GM only. */
export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const requestBody = await request.json();
    const parsed = uniqueBotCreateSchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Error parsing unique bot creation request",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const game = await getGame(parsed.data.gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can mint a unique bot for this game without a character",
        403
      );
    }

    if (parsed.data.sourceType === "CUSTOM") {
      const template = await getCustomBot(parsed.data.botId);
      if (!template) return errorResponse("Custom bot not found", 404);
      if (template.gameId !== parsed.data.gameId) {
        return errorResponse(
          "Template custom bot must belong to the supplied game.",
          400
        );
      }
    }

    if (parsed.data.sourceType === "OFFICIAL") {
      const template = await getBot(parsed.data.botId);
      if (!template) return errorResponse("Official bot not found", 404);
    }

    const uniqueBot = await createUniqueBot(
      uniqueBotCreateDataFromParsed(userId, parsed.data)
    );

    return NextResponse.json({ id: uniqueBot.id }, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/unique-bots",
      message: "Error creating unique bot",
      error,
    });
    return errorResponse(
      "Error creating unique bot",
      500,
      serializeError(error)
    );
  }
});

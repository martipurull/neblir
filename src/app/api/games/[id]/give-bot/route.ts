import { DEFAULT_BOT_REACTION_CAP } from "@/app/lib/botCombat";
import { presentBotHolding } from "@/app/lib/botHoldingView";
import { getBot } from "@/app/lib/prisma/bot";
import {
  BotCharacterConflictError,
  UNIQUE_BOT_ALREADY_HELD_MESSAGE,
  createBotCharacter,
  uniqueBotHoldingExists,
} from "@/app/lib/prisma/botCharacter";
import { getCustomBot } from "@/app/lib/prisma/customBot";
import { getGame } from "@/app/lib/prisma/game";
import { characterIsInGame } from "@/app/lib/prisma/gameCharacter";
import {
  getUniqueBot,
  resolveUniqueBotStats,
} from "@/app/lib/prisma/uniqueBot";
import { giveBotSchema } from "@/app/lib/types/bot";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can give bots in this game",
        403
      );
    }

    const parsed = giveBotSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const { characterId, sourceType, botId } = parsed.data;
    if (!(await characterIsInGame(gameId, characterId))) {
      return errorResponse("Character is not in this game", 403);
    }

    if (sourceType === "OFFICIAL") {
      const bot = await getBot(botId);
      if (!bot) return errorResponse("Official bot not found", 404);
      const created = await createBotCharacter({
        characterId,
        botId: bot.id,
        sourceType: "OFFICIAL",
        currentHp: bot.maxHp,
        maxHpBonus: 0,
        reactionsRemaining: bot.numberOfReactions ?? DEFAULT_BOT_REACTION_CAP,
      });
      return NextResponse.json(presentBotHolding(created, bot), {
        status: 201,
      });
    }

    if (sourceType === "CUSTOM") {
      const bot = await getCustomBot(botId);
      if (!bot) return errorResponse("Custom bot not found", 404);
      if (bot.gameId !== gameId) {
        return errorResponse(
          "That custom bot does not belong to this game.",
          403
        );
      }
      const created = await createBotCharacter({
        characterId,
        botId: bot.id,
        sourceType: "CUSTOM",
        currentHp: bot.maxHp,
        maxHpBonus: 0,
        reactionsRemaining: bot.numberOfReactions ?? DEFAULT_BOT_REACTION_CAP,
      });
      return NextResponse.json(
        presentBotHolding({ ...created, sourceType: "CUSTOM" }, bot),
        { status: 201 }
      );
    }

    const unique = await getUniqueBot(botId);
    if (!unique) return errorResponse("Unique bot not found", 404);
    if (unique.gameId !== gameId) {
      return errorResponse(
        "That unique bot does not belong to this game.",
        403
      );
    }
    if (unique.ownerUserId !== userId) {
      return errorResponse("You can only give a unique bot you minted.", 403);
    }
    if (await uniqueBotHoldingExists(unique.id)) {
      return errorResponse(UNIQUE_BOT_ALREADY_HELD_MESSAGE, 409);
    }

    const templateBot =
      unique.sourceType === "OFFICIAL" && unique.botId
        ? await getBot(unique.botId)
        : unique.sourceType === "CUSTOM" && unique.botId
          ? await getCustomBot(unique.botId)
          : null;
    const template = resolveUniqueBotStats(unique, templateBot);
    const created = await createBotCharacter({
      characterId,
      botId: unique.id,
      sourceType: "UNIQUE",
      currentHp: template.maxHp,
      maxHpBonus: 0,
      reactionsRemaining:
        template.numberOfReactions ?? DEFAULT_BOT_REACTION_CAP,
    });
    return NextResponse.json(
      presentBotHolding({ ...created, sourceType: "UNIQUE" }, template),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof BotCharacterConflictError) {
      return errorResponse(error.message, 409);
    }
    logger.error({
      method: "POST",
      route: "/api/games/[id]/give-bot",
      message: "Error giving bot",
      error,
    });
    return errorResponse(
      "Error giving bot to character",
      500,
      serializeError(error)
    );
  }
});

import { presentBotHolding } from "@/app/lib/botHoldingView";
import {
  characterIsInGame,
  userHasPlayControl,
} from "@/app/lib/prisma/gameCharacter";
import { getBot } from "@/app/lib/prisma/bot";
import { getCustomBot } from "@/app/lib/prisma/customBot";
import {
  BotCharacterConflictError,
  UNIQUE_BOT_ALREADY_HELD_MESSAGE,
  createBotCharacter,
  uniqueBotHoldingExists,
  hydrateBotCharacters,
  listBotCharacterRows,
} from "@/app/lib/prisma/botCharacter";
import {
  getUniqueBotRow,
  resolveUniqueBotStats,
} from "@/app/lib/prisma/uniqueBot";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { addBotToCharacterSchema } from "@/app/lib/types/bot";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: characterId } = (await params) as { id: string };
    if (!characterId || typeof characterId !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    if (!(await userHasPlayControl(characterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const rows = await listBotCharacterRows(characterId);
    const holdings = await hydrateBotCharacters(rows);
    return NextResponse.json(holdings);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/characters/[id]/bots",
      message: "Error retrieving character bots",
      error,
    });
    return errorResponse(
      "Error retrieving character bots",
      500,
      serializeError(error)
    );
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: characterId } = (await params) as { id: string };
    if (!characterId || typeof characterId !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    if (!(await userHasPlayControl(characterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const parsed = addBotToCharacterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const sourceType = parsed.data.sourceType ?? "OFFICIAL";
    const userId = request.auth.user.id;
    if (sourceType === "UNIQUE") {
      const unique = await getUniqueBotRow(parsed.data.botId);
      if (!unique) {
        return errorResponse("Unique bot not found", 404);
      }
      if (unique.ownerUserId !== userId) {
        return errorResponse("You can only add a unique bot you minted.", 403);
      }
      if (!(await characterIsInGame(unique.gameId, characterId))) {
        return errorResponse(
          "Character is not linked to the supplied game.",
          400
        );
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
      });
      return NextResponse.json(
        presentBotHolding({ ...created, sourceType: "UNIQUE" }, template),
        { status: 201 }
      );
    }

    if (sourceType === "CUSTOM") {
      const gameId = parsed.data.gameId;
      if (!gameId) {
        return errorResponse("Game is required", 400);
      }
      if (!(await characterIsInGame(gameId, characterId))) {
        return errorResponse(
          "Character is not linked to the supplied game.",
          400
        );
      }
      const customBot = await getCustomBot(parsed.data.botId);
      if (!customBot) {
        return errorResponse("Custom bot not found", 404);
      }
      if (customBot.gameId !== gameId) {
        return errorResponse(
          "That custom bot does not belong to the supplied game.",
          403
        );
      }

      const created = await createBotCharacter({
        characterId,
        botId: customBot.id,
        sourceType: "CUSTOM",
        currentHp: customBot.maxHp,
        maxHpBonus: 0,
      });
      return NextResponse.json(presentBotHolding(created, customBot), {
        status: 201,
      });
    }

    const bot = await getBot(parsed.data.botId);
    if (!bot) {
      return errorResponse("Official bot not found", 404);
    }

    const created = await createBotCharacter({
      characterId,
      botId: bot.id,
      currentHp: bot.maxHp,
      maxHpBonus: 0,
    });

    return NextResponse.json(presentBotHolding(created, bot), { status: 201 });
  } catch (error) {
    if (error instanceof BotCharacterConflictError) {
      return errorResponse(error.message, 409);
    }
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/bots",
      message: "Error adding bot to character",
      error,
    });
    return errorResponse(
      "Error adding bot to character",
      500,
      serializeError(error)
    );
  }
});

import { DEFAULT_BOT_REACTION_CAP } from "@/app/lib/botCombat";
import { presentBotHolding } from "@/app/lib/botHoldingView";
import { getCharacter } from "@/app/lib/prisma/character";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { getBot } from "@/app/lib/prisma/bot";
import {
  BotCharacterConflictError,
  createBotCharacter,
} from "@/app/lib/prisma/botCharacter";
import { getCustomBot } from "@/app/lib/prisma/customBot";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import {
  createUniqueBot,
  resolveUniqueBotStats,
  uniqueBotCreateDataFromParsed,
} from "@/app/lib/prisma/uniqueBot";
import { uniqueBotCreateSchema } from "@/app/lib/types/bot";
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

    const { id: characterId } = (await params) as { id: string };
    if (!characterId || typeof characterId !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    const parsed = uniqueBotCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Error parsing unique bot creation request",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const character = await getCharacter(characterId);
    if (!character) return errorResponse("Character not found", 404);

    const game = await getGame(parsed.data.gameId);
    if (!game) return errorResponse("Game not found", 404);

    const isOwner = await characterBelongsToUser(characterId, userId);
    const isGameMaster = game.gameMaster === userId;
    if (!isOwner && !isGameMaster) {
      return errorResponse(
        "You can only mint a unique bot for your own character unless you are the game master.",
        403
      );
    }

    const characterInGame = character.games?.some(
      (entry) => entry.game.id === parsed.data.gameId
    );
    if (!characterInGame) {
      return errorResponse(
        "Character is not linked to the supplied game.",
        400
      );
    }

    const actingUserInGame =
      isGameMaster || (await userIsInGame(parsed.data.gameId, userId));
    if (!actingUserInGame) {
      return errorResponse(
        "You must be part of the supplied game to mint a unique bot in it.",
        403
      );
    }

    let templateBot: {
      id: string;
      name: string;
      imageKey?: string | null;
      description?: string | null;
      confCost?: number | null;
      usage?: string | null;
      notes?: string | null;
      maxHp: number;
      maxCargoWeightKg?: number | null;
      maxInstalledItems?: number | null;
    } | null = null;
    if (parsed.data.sourceType === "CUSTOM") {
      const template = await getCustomBot(parsed.data.botId);
      if (!template) return errorResponse("Custom bot not found", 404);
      if (template.gameId !== parsed.data.gameId) {
        return errorResponse(
          "Template custom bot must belong to the supplied game.",
          400
        );
      }
      if (!isGameMaster && template.membersCanModify !== true) {
        return errorResponse(
          "The game master has not allowed members to mint a unique bot from this custom bot.",
          403
        );
      }
      templateBot = template;
    }

    if (parsed.data.sourceType === "OFFICIAL") {
      const template = await getBot(parsed.data.botId);
      if (!template) return errorResponse("Official bot not found", 404);
      templateBot = template;
    }

    const writeData = uniqueBotCreateDataFromParsed(userId, parsed.data);
    const uniqueBot = await createUniqueBot(writeData);
    const template = resolveUniqueBotStats(
      { ...writeData, id: uniqueBot.id },
      templateBot
    );
    const currentHp = template.maxHp;
    const created = await createBotCharacter({
      characterId,
      botId: uniqueBot.id,
      sourceType: "UNIQUE",
      currentHp,
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
      route: "/api/characters/[id]/unique-bots",
      message: "Error minting unique bot for character",
      error,
    });
    return errorResponse(
      "Error minting unique bot for character",
      500,
      serializeError(error)
    );
  }
});

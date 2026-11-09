import { presentBotHolding } from "@/app/lib/botHoldingView";
import { userHasPlayControl } from "@/app/lib/prisma/gameCharacter";
import {
  getBotCharacterRow,
  resolveHoldingTemplate,
} from "@/app/lib/prisma/botCharacter";
import {
  BotPlacementConflictError,
  placementsByHolding,
  returnBotItemToCarried,
} from "@/app/lib/prisma/botPlacement";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../../../shared/errors";
import { errorResponse } from "../../../../../../shared/responses";

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const {
      id: characterId,
      botCharacterId,
      itemCharacterId,
    } = (await params) as {
      id: string;
      botCharacterId: string;
      itemCharacterId: string;
    };
    if (
      !characterId ||
      typeof characterId !== "string" ||
      !botCharacterId ||
      typeof botCharacterId !== "string" ||
      !itemCharacterId ||
      typeof itemCharacterId !== "string"
    ) {
      return errorResponse("Invalid character, bot, or item ID", 400);
    }

    if (!(await userHasPlayControl(characterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const holding = await getBotCharacterRow(characterId, botCharacterId);
    if (!holding) {
      return errorResponse("Bot holding not found for this character", 404);
    }

    await returnBotItemToCarried({
      characterId,
      botCharacterId,
      itemCharacterId,
    });

    const template = await resolveHoldingTemplate(holding);
    const placements = await placementsByHolding(characterId, [botCharacterId]);
    return NextResponse.json(
      presentBotHolding(holding, template, placements.get(botCharacterId))
    );
  } catch (error) {
    if (error instanceof BotPlacementConflictError) {
      return errorResponse(error.message, error.status);
    }
    logger.error({
      method: "DELETE",
      route:
        "/api/characters/[id]/bots/[botCharacterId]/placements/[itemCharacterId]",
      message: "Error returning a bot item to carried inventory",
      error,
    });
    return errorResponse(
      "Error returning a bot item to carried inventory",
      500,
      serializeError(error)
    );
  }
});

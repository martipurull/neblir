import { presentBotHolding } from "@/app/lib/botHoldingView";
import { userHasPlayControl } from "@/app/lib/prisma/gameCharacter";
import {
  getBotCharacterRow,
  resolveHoldingTemplate,
} from "@/app/lib/prisma/botCharacter";
import {
  BotPlacementConflictError,
  placementsByHolding,
  setBotEquip,
} from "@/app/lib/prisma/botPlacement";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { botEquipSchema } from "@/app/lib/types/bot";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../../shared/errors";
import { errorResponse } from "../../../../../shared/responses";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: characterId, botCharacterId } = (await params) as {
      id: string;
      botCharacterId: string;
    };
    if (
      !characterId ||
      typeof characterId !== "string" ||
      !botCharacterId ||
      typeof botCharacterId !== "string"
    ) {
      return errorResponse("Invalid character or bot holding ID", 400);
    }

    if (!(await userHasPlayControl(characterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const parsed = botEquipSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const holding = await getBotCharacterRow(characterId, botCharacterId);
    if (!holding) {
      return errorResponse("Bot holding not found for this character", 404);
    }

    const template = await resolveHoldingTemplate(holding);
    if (!template) {
      return errorResponse("Bot not found", 404);
    }

    await setBotEquip({
      characterId,
      botCharacterId,
      itemCharacterId: parsed.data.itemCharacterId,
      action: parsed.data.action,
      slot: parsed.data.slot,
    });

    const placements = await placementsByHolding(characterId, [botCharacterId]);
    return NextResponse.json(
      presentBotHolding(holding, template, placements.get(botCharacterId))
    );
  } catch (error) {
    if (error instanceof BotPlacementConflictError) {
      return errorResponse(error.message, error.status);
    }
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/bots/[botCharacterId]/equip",
      message: "Error equipping an item on a bot",
      error,
    });
    return errorResponse(
      "Error equipping an item on a bot",
      500,
      serializeError(error)
    );
  }
});

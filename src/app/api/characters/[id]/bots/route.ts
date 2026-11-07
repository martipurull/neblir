import { presentBotHolding } from "@/app/lib/botHoldingView";
import { userHasPlayControl } from "@/app/lib/prisma/gameCharacter";
import { getBot } from "@/app/lib/prisma/bot";
import {
  createBotCharacter,
  hydrateBotCharacters,
  listBotCharacterRows,
} from "@/app/lib/prisma/botCharacter";
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

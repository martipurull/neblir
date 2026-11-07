import { userHasPlayControl } from "@/app/lib/prisma/gameCharacter";
import { getBotCharacterRow } from "@/app/lib/prisma/botCharacter";
import {
  performBotHoldingTransfer,
  validateBotHoldingTransfer,
} from "@/app/lib/prisma/botHoldingTransfer";
import { BotPlacementConflictError } from "@/app/lib/prisma/botPlacement";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { transferBotHoldingSchema } from "@/app/lib/types/bot";
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

    const { id: fromCharacterId, botCharacterId } = (await params) as {
      id: string;
      botCharacterId: string;
    };
    if (
      !fromCharacterId ||
      typeof fromCharacterId !== "string" ||
      !botCharacterId ||
      typeof botCharacterId !== "string"
    ) {
      return errorResponse("Invalid character or bot holding ID", 400);
    }

    if (!(await userHasPlayControl(fromCharacterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const parsed = transferBotHoldingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const holding = await getBotCharacterRow(fromCharacterId, botCharacterId);
    if (!holding) {
      return errorResponse("Bot holding not found for this character", 404);
    }

    const partyError = await validateBotHoldingTransfer(
      fromCharacterId,
      parsed.data.toCharacterId,
      request.auth.user.id,
      holding
    );
    if (partyError) {
      return errorResponse(partyError.message, partyError.status);
    }

    await performBotHoldingTransfer({
      fromCharacterId,
      toCharacterId: parsed.data.toCharacterId,
      botCharacterId,
    });

    return NextResponse.json({ message: "Bot transferred" });
  } catch (error) {
    if (error instanceof BotPlacementConflictError) {
      return errorResponse(error.message, error.status);
    }
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/bots/[botCharacterId]/transfer",
      message: "Error transferring bot holding",
      error,
    });
    return errorResponse(
      "Error transferring bot holding",
      500,
      serializeError(error)
    );
  }
});

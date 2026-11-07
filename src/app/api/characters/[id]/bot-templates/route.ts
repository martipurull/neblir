import { userHasPlayControl } from "@/app/lib/prisma/gameCharacter";
import { getBots } from "@/app/lib/prisma/bot";
import type { AuthNextRequest } from "@/app/lib/types/api";
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

    const bots = await getBots();
    return NextResponse.json(bots);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/characters/[id]/bot-templates",
      message: "Error listing bots that can be held",
      error,
    });
    return errorResponse(
      "Error listing bots that can be held",
      500,
      serializeError(error)
    );
  }
});

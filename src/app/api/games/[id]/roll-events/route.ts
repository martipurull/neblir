import { errorResponse } from "@/app/api/shared/responses";
import {
  userOwnsCharacter,
  characterIsInGame,
} from "@/app/lib/prisma/gameCharacter";
import { prisma } from "@/app/lib/prisma/client";
import type { Prisma } from "@prisma/client";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { rollEventPayloadSchema } from "@/app/lib/types/roll-event";
import { auth } from "@/auth";
import logger from "@/logger";
import { serializeError } from "../../../shared/errors";
import { NextResponse } from "next/server";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) {
      return errorResponse("User ID not found", 400);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const inGame = await userIsInGame(gameId, userId);
    if (!inGame) {
      return errorResponse("You are not part of this game", 403);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const requestBody = await request.json();
    const parsed = rollEventPayloadSchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const payload = parsed.data;
    if (payload.characterId) {
      const inThisGame = await characterIsInGame(gameId, payload.characterId);
      if (!inThisGame) {
        return errorResponse("Character is not in this game", 403);
      }

      const isGameMaster = game.gameMaster === userId;
      const owns = await userOwnsCharacter(payload.characterId, userId);
      if (!isGameMaster && !owns) {
        return errorResponse(
          "You can only emit rolls for your own character",
          403
        );
      }
    }

    const integration = await prisma.discordIntegration.findUnique({
      where: { gameId },
    });

    const created = await prisma.rollEvent.create({
      data: {
        gameId,
        characterId: payload.characterId,
        rollerUserId: userId,
        rollType: payload.rollType,
        diceExpression: payload.diceExpression,
        results: payload.results,
        total: payload.total,
        metadata:
          payload.metadata === undefined
            ? undefined
            : (payload.metadata as Prisma.InputJsonValue),
      },
    });

    const queued =
      integration != null &&
      (integration.status === "ACTIVE" || integration.status === "DEGRADED");
    if (queued) {
      await prisma.discordOutbox.create({
        data: {
          rollEventId: created.id,
          integrationId: integration.id,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ id: created.id, queued }, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/roll-events",
      message: "Error creating roll event",
      error,
    });
    return errorResponse(
      "Error creating roll event",
      500,
      serializeError(error)
    );
  }
});

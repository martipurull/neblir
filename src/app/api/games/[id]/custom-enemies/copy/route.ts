import {
  createCustomEnemy,
  getCustomEnemy,
} from "@/app/lib/prisma/customEnemy";
import { getGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { customEnemyCopyBodySchema } from "@/app/lib/types/enemy";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: targetGameId } = (await params) as { id: string };
    if (!targetGameId || typeof targetGameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const targetGame = await getGame(targetGameId);
    if (!targetGame) return errorResponse("Game not found", 404);
    if (targetGame.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can copy enemies into this game.",
        403
      );
    }

    const body = await request.json();
    const parsed = customEnemyCopyBodySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    const { sourceGameId, sourceCustomEnemyId } = parsed.data;
    if (sourceGameId === targetGameId) {
      return errorResponse("Source and target game must differ.", 400);
    }

    const sourceGame = await getGame(sourceGameId);
    if (!sourceGame) return errorResponse("Source game not found", 404);
    if (sourceGame.gameMaster !== userId) {
      return errorResponse(
        "You can only copy from games where you are the game master.",
        403
      );
    }

    const source = await getCustomEnemy(sourceCustomEnemyId);
    if (source?.gameId !== sourceGameId) {
      return errorResponse("Source custom enemy not found", 404);
    }

    const created = await createCustomEnemy({
      gameId: targetGameId,
      name: source.name,
      description: source.description ?? undefined,
      imageKey: source.imageKey ?? undefined,
      health: source.health,
      speed: source.speed,
      initiativeModifier: source.initiativeModifier,
      numberOfReactions: source.numberOfReactions,
      defenceMelee: source.defenceMelee,
      defenceRange: source.defenceRange,
      defenceGrid: source.defenceGrid,
      attackMelee: source.attackMelee,
      attackRange: source.attackRange,
      attackThrow: source.attackThrow,
      attackGrid: source.attackGrid,
      immunities: source.immunities,
      resistances: source.resistances,
      vulnerabilities: source.vulnerabilities,
      actions: source.actions ?? [],
      additionalActions: source.additionalActions ?? [],
      notes: source.notes ?? undefined,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/custom-enemies/copy",
      message: "Error copying custom enemy",
      error,
    });
    return errorResponse(
      "Error copying custom enemy",
      500,
      serializeError(error)
    );
  }
});

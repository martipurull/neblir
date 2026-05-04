import { getCustomEnemiesByGame } from "@/app/lib/prisma/customEnemy";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import {
  customEnemyCsvHeaderLine,
  serializeCustomEnemyRowToCsvLine,
} from "@/app/lib/enemyCsv";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { sanitizeAttachmentFilenamePart } from "../../../../shared/filename";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);

    const isGameMaster = game.gameMaster === request.auth.user.id;
    const isInGame = await userIsInGame(gameId, request.auth.user.id);
    if (!isGameMaster && !isInGame) {
      return errorResponse("You do not have access to this game.", 403);
    }

    const enemies = await getCustomEnemiesByGame(gameId);
    const lines = [customEnemyCsvHeaderLine()];
    for (const e of enemies) {
      lines.push(
        serializeCustomEnemyRowToCsvLine({
          name: e.name,
          description: e.description,
          imageKey: e.imageKey,
          health: e.health,
          speed: e.speed,
          initiativeModifier: e.initiativeModifier,
          numberOfReactions: e.numberOfReactions,
          defenceMelee: e.defenceMelee,
          defenceRange: e.defenceRange,
          defenceGrid: e.defenceGrid,
          attackMelee: e.attackMelee,
          attackRange: e.attackRange,
          attackThrow: e.attackThrow,
          attackGrid: e.attackGrid,
          immunities: e.immunities,
          resistances: e.resistances,
          vulnerabilities: e.vulnerabilities,
          notes: e.notes,
          actions: e.actions ?? [],
          additionalActions: e.additionalActions ?? [],
        })
      );
    }

    const body = lines.join("\r\n") + "\r\n";
    const filename = `custom-enemies-${sanitizeAttachmentFilenamePart(game.name, "game")}.csv`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/custom-enemies/export",
      message: "Error exporting custom enemies",
      error,
    });
    return errorResponse(
      "Error exporting custom enemies",
      500,
      serializeError(error)
    );
  }
});

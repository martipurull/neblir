import { getCustomEnemy } from "@/app/lib/prisma/customEnemy";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import {
  customEnemyCsvHeaderLine,
  serializeCustomEnemyRowToCsvLine,
} from "@/app/lib/enemyCsv";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../../shared/errors";
import { errorResponse } from "../../../../../shared/responses";

function sanitizeFilenamePart(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "enemy";
}

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);

    const { id: gameId, customEnemyId } = (await params) as {
      id: string;
      customEnemyId: string;
    };
    if (!gameId || !customEnemyId) {
      return errorResponse("Invalid game or custom enemy ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);

    const isGameMaster = game.gameMaster === request.auth.user.id;
    const isInGame = await userIsInGame(gameId, request.auth.user.id);
    if (!isGameMaster && !isInGame) {
      return errorResponse("You do not have access to this game.", 403);
    }

    const enemy = await getCustomEnemy(customEnemyId);
    if (enemy?.gameId !== gameId) {
      return errorResponse("Custom enemy not found", 404);
    }

    const body =
      customEnemyCsvHeaderLine() +
      "\r\n" +
      serializeCustomEnemyRowToCsvLine({
        name: enemy.name,
        description: enemy.description,
        imageKey: enemy.imageKey,
        health: enemy.health,
        speed: enemy.speed,
        initiativeModifier: enemy.initiativeModifier,
        numberOfReactions: enemy.numberOfReactions,
        defenceMelee: enemy.defenceMelee,
        defenceRange: enemy.defenceRange,
        defenceGrid: enemy.defenceGrid,
        attackMelee: enemy.attackMelee,
        attackRange: enemy.attackRange,
        attackThrow: enemy.attackThrow,
        attackGrid: enemy.attackGrid,
        immunities: enemy.immunities,
        resistances: enemy.resistances,
        vulnerabilities: enemy.vulnerabilities,
        notes: enemy.notes,
        actions: enemy.actions ?? [],
        additionalActions: enemy.additionalActions ?? [],
      }) +
      "\r\n";

    const filename = `custom-enemy-${sanitizeFilenamePart(enemy.name)}.csv`;

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
      route: "/api/games/[id]/custom-enemies/[customEnemyId]/export",
      message: "Error exporting custom enemy",
      error,
    });
    return errorResponse(
      "Error exporting custom enemy",
      500,
      serializeError(error)
    );
  }
});

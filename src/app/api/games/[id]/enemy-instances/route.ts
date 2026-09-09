import { withInstanceLabels } from "@/app/lib/enemyInstanceLabel";
import { allocateEnemyInstanceSpawns } from "@/app/lib/enemyInstanceNumber";
import { getCustomEnemy } from "@/app/lib/prisma/customEnemy";
import { getEnemy } from "@/app/lib/prisma/enemy";
import {
  createEnemyInstance,
  deleteEnemyInstancesForGame,
  getEnemyInstancesByGame,
} from "@/app/lib/prisma/enemyInstance";
import { uncheckedSnapshotFromEnemyTemplate } from "@/app/lib/prisma/enemyInstanceSnapshot";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import {
  enemyInstanceDeleteSetBodySchema,
  enemyInstanceSpawnBodySchema,
} from "@/app/lib/types/enemy";
import { auth } from "@/auth";
import { logger } from "@/logger";
import type { CustomEnemy, Enemy } from "@prisma/client";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

async function spawnAllocatedInstances(
  template: Enemy | CustomEnemy,
  options: {
    gameId: string;
    count: number;
    isPublic: boolean;
    instanceName: string;
    sourceCustomEnemyId?: string;
    sourceOfficialEnemyId?: string;
  }
) {
  const occupiedRows = await getEnemyInstancesByGame(options.gameId);
  const occupied = options.sourceCustomEnemyId
    ? occupiedRows.filter(
        (row) => row.sourceCustomEnemyId === options.sourceCustomEnemyId
      )
    : occupiedRows.filter(
        (row) => row.sourceOfficialEnemyId === options.sourceOfficialEnemyId
      );
  const allocations = allocateEnemyInstanceSpawns({
    occupied,
    count: options.count,
    sourceName: template.name,
    instanceName: options.instanceName,
  });
  const created = [];
  for (const allocation of allocations) {
    created.push(
      await createEnemyInstance(
        uncheckedSnapshotFromEnemyTemplate(template, {
          gameId: options.gameId,
          name: allocation.name,
          isPublic: options.isPublic,
          sourceCustomEnemyId: options.sourceCustomEnemyId,
          sourceOfficialEnemyId: options.sourceOfficialEnemyId,
          instanceNumber: allocation.instanceNumber,
          sourceName: allocation.sourceName,
          renamed: allocation.renamed,
          numberVisible: allocation.numberVisible,
        })
      )
    );
  }
  return created;
}

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);
    const { id: gameId } = (await params) as { id: string };
    if (!gameId) return errorResponse("Invalid game ID", 400);
    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    const allowed =
      game.gameMaster === request.auth.user.id ||
      (await userIsInGame(gameId, request.auth.user.id));
    if (!allowed)
      return errorResponse("You do not have access to this game.", 403);
    const rows = await getEnemyInstancesByGame(gameId);
    const isGameMaster = game.gameMaster === request.auth.user.id;
    const labeled = withInstanceLabels(rows, isGameMaster);
    const visible = isGameMaster
      ? labeled
      : labeled.filter((row) => row.isPublic !== false);
    return NextResponse.json(visible);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/enemy-instances",
      message: "Error fetching enemy instances",
      error,
    });
    return errorResponse(
      "Error fetching enemy instances",
      500,
      serializeError(error)
    );
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);
    const { id: gameId } = (await params) as { id: string };
    if (!gameId) return errorResponse("Invalid game ID", 400);
    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse("Only the game master can spawn enemies.", 403);
    }
    const parsed = enemyInstanceSpawnBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }
    const count = parsed.data.count ?? 1;
    const isPublic = parsed.data.isPublic ?? false;

    let createdRecords: Awaited<ReturnType<typeof createEnemyInstance>>[];

    if (parsed.data.sourceCustomEnemyId) {
      const source = await getCustomEnemy(parsed.data.sourceCustomEnemyId);
      if (source?.gameId !== gameId) {
        return errorResponse("Source enemy not found", 404);
      }
      createdRecords = await spawnAllocatedInstances(source, {
        gameId,
        count,
        isPublic,
        instanceName: parsed.data.nameOverride ?? source.name,
        sourceCustomEnemyId: source.id,
      });
    } else if (parsed.data.sourceOfficialEnemyId) {
      const source = await getEnemy(parsed.data.sourceOfficialEnemyId);
      if (!source) {
        return errorResponse("Source enemy not found", 404);
      }
      createdRecords = await spawnAllocatedInstances(source, {
        gameId,
        count,
        isPublic,
        instanceName: parsed.data.nameOverride ?? source.name,
        sourceOfficialEnemyId: source.id,
      });
    } else {
      return errorResponse("Invalid source", 400);
    }

    return NextResponse.json(
      { instances: withInstanceLabels(createdRecords) },
      { status: 201 }
    );
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/enemy-instances",
      message: "Error creating enemy instance",
      error,
    });
    return errorResponse(
      "Error creating enemy instance",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);
    const { id: gameId } = (await params) as { id: string };
    if (!gameId) return errorResponse("Invalid game ID", 400);
    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can remove enemy instances.",
        403
      );
    }
    const parsed = enemyInstanceDeleteSetBodySchema.safeParse(
      await request.json()
    );
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }
    const result = await deleteEnemyInstancesForGame(
      gameId,
      parsed.data.instanceIds
    );
    if (!result.deleted) {
      return errorResponse("Enemy instance not found", 404);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]/enemy-instances",
      message: "Error deleting enemy instances",
      error,
    });
    return errorResponse(
      "Error deleting enemy instances",
      500,
      serializeError(error)
    );
  }
});

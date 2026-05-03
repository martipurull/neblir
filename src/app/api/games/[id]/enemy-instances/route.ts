import {
  createEnemyInstance,
  getEnemyInstancesByGame,
} from "@/app/lib/prisma/enemyInstance";
import { uncheckedSnapshotFromEnemyTemplate } from "@/app/lib/prisma/enemyInstanceSnapshot";
import { getCustomEnemy } from "@/app/lib/prisma/customEnemy";
import { getEnemy } from "@/app/lib/prisma/enemy";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

const createBodySchema = z
  .object({
    sourceCustomEnemyId: z.string().min(1).optional(),
    sourceOfficialEnemyId: z.string().min(1).optional(),
    count: z.number().int().min(1).max(50).optional(),
    nameOverride: z.string().trim().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    const hasCustom = Boolean(data.sourceCustomEnemyId?.trim());
    const hasOfficial = Boolean(data.sourceOfficialEnemyId?.trim());
    if (hasCustom === hasOfficial) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Specify exactly one of sourceCustomEnemyId or sourceOfficialEnemyId",
        path: hasCustom ? ["sourceOfficialEnemyId"] : ["sourceCustomEnemyId"],
      });
    }
  });

function instanceDisplayNames(count: number, baseName: string): string[] {
  if (count <= 1) return [baseName];
  return Array.from({ length: count }, (_, i) => `${baseName} #${i + 1}`);
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
    return NextResponse.json(rows);
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
    const parsed = createBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }
    const count = parsed.data.count ?? 1;

    let createdRecords: Awaited<ReturnType<typeof createEnemyInstance>>[];

    if (parsed.data.sourceCustomEnemyId) {
      const source = await getCustomEnemy(parsed.data.sourceCustomEnemyId);
      if (source?.gameId !== gameId) {
        return errorResponse("Source enemy not found", 404);
      }
      const overrideName = parsed.data.nameOverride?.trim();
      const baseName = overrideName?.length ? overrideName : source.name;
      const names = instanceDisplayNames(count, baseName);
      createdRecords = [];
      for (const name of names) {
        const row = await createEnemyInstance(
          uncheckedSnapshotFromEnemyTemplate(source, {
            gameId,
            name,
            sourceCustomEnemyId: source.id,
            sourceOfficialEnemyId: undefined,
          })
        );
        createdRecords.push(row);
      }
    } else if (parsed.data.sourceOfficialEnemyId) {
      const source = await getEnemy(parsed.data.sourceOfficialEnemyId);
      if (!source) {
        return errorResponse("Source enemy not found", 404);
      }
      const overrideName = parsed.data.nameOverride?.trim();
      const baseName = overrideName?.length ? overrideName : source.name;
      const names = instanceDisplayNames(count, baseName);
      createdRecords = [];
      for (const name of names) {
        const row = await createEnemyInstance(
          uncheckedSnapshotFromEnemyTemplate(source, {
            gameId,
            name,
            sourceCustomEnemyId: undefined,
            sourceOfficialEnemyId: source.id,
          })
        );
        createdRecords.push(row);
      }
    } else {
      return errorResponse("Invalid source", 400);
    }

    return NextResponse.json({ instances: createdRecords }, { status: 201 });
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

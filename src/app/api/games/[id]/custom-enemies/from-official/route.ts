import { createCustomEnemy } from "@/app/lib/prisma/customEnemy";
import { getEnemy } from "@/app/lib/prisma/enemy";
import { getGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

const bodySchema = z.object({
  enemyId: z.string().min(1),
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can add enemies to this game.",
        403
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    const source = await getEnemy(parsed.data.enemyId);
    if (!source) return errorResponse("Enemy not found", 404);

    const created = await createCustomEnemy({
      gameId,
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
      route: "/api/games/[id]/custom-enemies/from-official",
      message: "Error adding official enemy to game",
      error,
    });
    return errorResponse(
      "Error adding official enemy",
      500,
      serializeError(error)
    );
  }
});

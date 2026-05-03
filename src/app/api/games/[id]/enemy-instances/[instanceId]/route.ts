import {
  deleteEnemyInstance,
  getEnemyInstance,
  updateEnemyInstance,
} from "@/app/lib/prisma/enemyInstance";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import logger from "@/logger";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

const patchBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  notes: z.string().optional(),
  imageKey: z.string().min(1).nullable().optional(),
  currentHealth: z.number().int().nonnegative().optional(),
  maxHealth: z.number().int().min(1).optional(),
  speed: z.number().int().min(0).optional(),
  initiativeModifier: z.number().int().optional(),
  reactionsPerRound: z.number().int().min(0).optional(),
  reactionsRemaining: z.number().int().nonnegative().optional(),
  status: z.enum(["ACTIVE", "DEFEATED", "DEAD"]).optional(),
});

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);
    const { id: gameId, instanceId } = (await params) as {
      id: string;
      instanceId: string;
    };
    if (!gameId || !instanceId) return errorResponse("Invalid request", 400);
    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    const allowed =
      game.gameMaster === request.auth.user.id ||
      (await userIsInGame(gameId, request.auth.user.id));
    if (!allowed)
      return errorResponse("You do not have access to this game.", 403);
    const row = await getEnemyInstance(instanceId);
    if (row?.gameId !== gameId)
      return errorResponse("Enemy instance not found", 404);
    return NextResponse.json(row);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/enemy-instances/[instanceId]",
      message: "Error fetching enemy instance",
      error,
    });
    return errorResponse(
      "Error fetching enemy instance",
      500,
      serializeError(error)
    );
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);
    const { id: gameId, instanceId } = (await params) as {
      id: string;
      instanceId: string;
    };
    if (!gameId || !instanceId) return errorResponse("Invalid request", 400);
    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can update enemy instances.",
        403
      );
    }
    const existing = await getEnemyInstance(instanceId);
    if (existing?.gameId !== gameId) {
      return errorResponse("Enemy instance not found", 404);
    }
    const parsed = patchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }
    const nextMaxHealth = parsed.data.maxHealth ?? existing.maxHealth;
    let nextCurrentHealth = parsed.data.currentHealth ?? existing.currentHealth;
    if (parsed.data.maxHealth != null && parsed.data.currentHealth == null) {
      nextCurrentHealth = Math.min(
        existing.currentHealth,
        parsed.data.maxHealth
      );
    }
    if (nextCurrentHealth > nextMaxHealth) {
      return errorResponse("currentHealth cannot exceed maxHealth", 400);
    }

    const nextReactionsPerRound =
      parsed.data.reactionsPerRound ?? existing.reactionsPerRound;
    let nextReactionsRemaining =
      parsed.data.reactionsRemaining ?? existing.reactionsRemaining;
    if (
      parsed.data.reactionsPerRound != null &&
      parsed.data.reactionsRemaining == null
    ) {
      nextReactionsRemaining = Math.min(
        nextReactionsRemaining,
        parsed.data.reactionsPerRound
      );
    }
    if (nextReactionsRemaining > nextReactionsPerRound) {
      return errorResponse(
        "reactionsRemaining cannot exceed reactionsPerRound",
        400
      );
    }

    const data: Prisma.EnemyInstanceUpdateInput = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined)
      data.description = parsed.data.description;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
    if (parsed.data.imageKey !== undefined)
      data.imageKey = parsed.data.imageKey;
    if (parsed.data.speed !== undefined) data.speed = parsed.data.speed;
    if (parsed.data.initiativeModifier !== undefined) {
      data.initiativeModifier = parsed.data.initiativeModifier;
    }
    if (parsed.data.status !== undefined) data.status = parsed.data.status;
    if (parsed.data.maxHealth !== undefined)
      data.maxHealth = parsed.data.maxHealth;
    if (
      parsed.data.currentHealth !== undefined ||
      parsed.data.maxHealth !== undefined
    ) {
      data.currentHealth = nextCurrentHealth;
    }
    if (parsed.data.reactionsPerRound !== undefined) {
      data.reactionsPerRound = parsed.data.reactionsPerRound;
    }
    if (
      parsed.data.reactionsRemaining !== undefined ||
      parsed.data.reactionsPerRound !== undefined
    ) {
      data.reactionsRemaining = nextReactionsRemaining;
    }

    const updated = await updateEnemyInstance(instanceId, data);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]/enemy-instances/[instanceId]",
      message: "Error updating enemy instance",
      error,
    });
    return errorResponse(
      "Error updating enemy instance",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);
    const { id: gameId, instanceId } = (await params) as {
      id: string;
      instanceId: string;
    };
    if (!gameId || !instanceId) return errorResponse("Invalid request", 400);
    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can remove enemy instances.",
        403
      );
    }
    const existing = await getEnemyInstance(instanceId);
    if (existing?.gameId !== gameId) {
      return errorResponse("Enemy instance not found", 404);
    }
    await deleteEnemyInstance(instanceId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]/enemy-instances/[instanceId]",
      message: "Error deleting enemy instance",
      error,
    });
    return errorResponse(
      "Error deleting enemy instance",
      500,
      serializeError(error)
    );
  }
});

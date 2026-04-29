import { auth } from "@/auth";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";
import { userIsInGame } from "@/app/lib/prisma/game";
import { prisma } from "@/app/lib/prisma/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const addCharactersSchema = z
  .object({
    characterIds: z.array(z.string()).optional(),
    characters: z
      .array(
        z.object({
          characterId: z.string().min(1),
          isPublic: z.boolean().optional(),
        })
      )
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (
      (!val.characterIds || val.characterIds.length === 0) &&
      (!val.characters || val.characters.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one character to link.",
      });
    }
  });

const removeCharacterSchema = z.object({
  characterId: z.string().min(1),
});

const updateCharacterVisibilitySchema = z.object({
  characterId: z.string().min(1),
  isPublic: z.boolean(),
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/games/[id]/characters",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) {
      logger.error({
        method: "POST",
        route: "/api/games/[id]/characters",
        message: "User ID not found on session",
      });
      return errorResponse("User ID not found", 400);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      logger.error({
        method: "POST",
        route: "/api/games/[id]/characters",
        message: "Invalid game ID",
        gameId,
      });
      return errorResponse("Invalid game ID", 400);
    }

    const inGame = await userIsInGame(gameId, userId);
    if (!inGame) {
      logger.warn({
        method: "POST",
        route: "/api/games/[id]/characters",
        message: "User is not part of game",
        gameId,
        userId,
      });
      return errorResponse("You are not part of this game", 403);
    }
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { gameMaster: true },
    });
    if (!game) {
      logger.warn({
        method: "POST",
        route: "/api/games/[id]/characters",
        message: "Game not found",
        gameId,
        userId,
      });
      return errorResponse("Game not found", 404);
    }
    const isGameMaster = game.gameMaster === userId;

    const requestBody = await request.json();
    const parsed = addCharactersSchema.safeParse(requestBody);
    if (!parsed.success) {
      logger.warn({
        method: "POST",
        route: "/api/games/[id]/characters",
        message: "Invalid request body",
        gameId,
        userId,
        details: parsed.error.issues,
      });
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    const requestedCharacters =
      parsed.data.characters && parsed.data.characters.length > 0
        ? parsed.data.characters
        : (parsed.data.characterIds ?? []).map((characterId) => ({
            characterId,
            isPublic: true,
          }));
    const dedupedByCharacterId = new Map<
      string,
      { characterId: string; isPublic: boolean }
    >();
    for (const row of requestedCharacters) {
      dedupedByCharacterId.set(row.characterId, {
        characterId: row.characterId,
        isPublic: row.isPublic ?? true,
      });
    }
    const characterRows = Array.from(dedupedByCharacterId.values());
    const characterIds = characterRows.map((c) => c.characterId);

    const owned = await prisma.characterUser.findMany({
      where: { userId, characterId: { in: characterIds } },
      select: { characterId: true },
    });
    const ownedIds = new Set(owned.map((o) => o.characterId));
    const notOwned = characterIds.filter((cid) => !ownedIds.has(cid));
    if (notOwned.length > 0) {
      logger.warn({
        method: "POST",
        route: "/api/games/[id]/characters",
        message: "Attempt to link non-owned characters",
        gameId,
        userId,
        notOwnedCharacterIds: notOwned,
      });
      return errorResponse("Some characters are not owned by you", 403);
    }

    // Prisma (Mongo) doesn't support createMany(skipDuplicates), so we insert one-by-one.
    // We also return per-character outcomes so the UI can show partial failures.
    const linkedIds: string[] = [];
    const alreadyLinkedIds: string[] = [];
    const failed: Array<{ characterId: string; reason: string }> = [];

    for (const row of characterRows) {
      const characterId = row.characterId;
      try {
        await prisma.gameCharacter.create({
          data: {
            gameId,
            characterId,
            isPublic: isGameMaster ? row.isPublic : true,
          },
        });
        linkedIds.push(characterId);
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          alreadyLinkedIds.push(characterId);
          continue;
        }
        logger.error({
          method: "POST",
          route: "/api/games/[id]/characters",
          message: "Failed to link character to game",
          gameId,
          userId,
          characterId,
          error: serializeError(e),
        });
        failed.push({ characterId, reason: "Failed to link character" });
      }
    }

    const linkedCount = linkedIds.length;

    return NextResponse.json(
      {
        success: failed.length === 0,
        linkedCount,
        linkedIds,
        alreadyLinkedIds,
        failed,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/characters",
      message: "Error linking characters to game",
      error,
    });
    return errorResponse(
      "Error linking characters to game",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/games/[id]/characters",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) {
      logger.error({
        method: "DELETE",
        route: "/api/games/[id]/characters",
        message: "User ID not found on session",
      });
      return errorResponse("User ID not found", 400);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      logger.error({
        method: "DELETE",
        route: "/api/games/[id]/characters",
        message: "Invalid game ID",
        gameId,
      });
      return errorResponse("Invalid game ID", 400);
    }

    const inGame = await userIsInGame(gameId, userId);
    if (!inGame) {
      logger.warn({
        method: "DELETE",
        route: "/api/games/[id]/characters",
        message: "User is not part of game",
        gameId,
        userId,
      });
      return errorResponse("You are not part of this game", 403);
    }

    const requestBody = await request.json();
    const parsed = removeCharacterSchema.safeParse(requestBody);
    if (!parsed.success) {
      logger.warn({
        method: "DELETE",
        route: "/api/games/[id]/characters",
        message: "Invalid request body",
        gameId,
        userId,
        details: parsed.error.issues,
      });
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    const characterId = parsed.data.characterId;
    const owned = await prisma.characterUser.findMany({
      where: { userId, characterId: { in: [characterId] } },
      select: { characterId: true },
    });
    if (owned.length === 0) {
      logger.warn({
        method: "DELETE",
        route: "/api/games/[id]/characters",
        message: "Attempt to unlink non-owned character",
        gameId,
        userId,
        characterId,
      });
      return errorResponse("This character is not owned by you", 403);
    }

    const result = await prisma.gameCharacter.deleteMany({
      where: { gameId, characterId },
    });

    return NextResponse.json(
      {
        success: true,
        removed: result.count > 0,
        removedCount: result.count,
        characterId,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]/characters",
      message: "Error unlinking character from game",
      error,
    });
    return errorResponse(
      "Error unlinking character from game",
      500,
      serializeError(error)
    );
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
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

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { gameMaster: true },
    });
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can update NPC visibility",
        403
      );
    }

    const requestBody = await request.json();
    const parsed = updateCharacterVisibilitySchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    const { characterId, isPublic } = parsed.data;
    const updated = await prisma.gameCharacter.updateMany({
      where: { gameId, characterId },
      data: { isPublic },
    });
    if (updated.count === 0) {
      return errorResponse("Character is not linked to this game", 404);
    }

    return NextResponse.json({
      success: true,
      characterId,
      isPublic,
    });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]/characters",
      message: "Error updating character visibility",
      error,
    });
    return errorResponse(
      "Error updating character visibility",
      500,
      serializeError(error)
    );
  }
});

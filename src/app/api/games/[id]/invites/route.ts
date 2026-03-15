import {
  getGame,
  getPendingInvitesForGame,
  userIsInGame,
  hasPendingInvite,
  createGameInvites,
} from "@/app/lib/prisma/game";
import { getUserByEmail } from "@/app/lib/prisma/user";
import { auth } from "@/auth";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";
import { z } from "zod";

const inviteBodySchema = z.object({
  emails: z
    .array(z.string().email("Invalid email"))
    .min(1, "At least one email is required")
    .max(50, "Too many emails"),
});

/** List pending invites for this game (GM only). */
export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }
    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can list pending invites",
        403
      );
    }

    const invites = await getPendingInvitesForGame(gameId);
    const payload = invites.map((inv) => ({
      invitedUserId: inv.invitedUserId,
      invitedUserName: inv.invitedUser.name,
      invitedUserEmail: inv.invitedUser.email,
      createdAt: inv.createdAt,
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/invites",
      message: "Error fetching pending invites",
      error,
    });
    return errorResponse(
      "Error fetching pending invites",
      500,
      serializeError(error)
    );
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/games/[id]/invites",
        message: "Unauthorised access attempt",
      });
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

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can invite users", 403);
    }

    const body = await request.json();
    const parsed = inviteBodySchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(". ");
      return errorResponse("Invalid request", 400, message);
    }

    const rawEmails = parsed.data.emails;
    const emails = [
      ...new Set(rawEmails.map((e) => e.trim().toLowerCase())),
    ].filter(Boolean);

    const invitedUserIds: string[] = [];
    const invitedEmails: string[] = [];
    const notFound: string[] = [];
    const alreadyInGame: string[] = [];
    const alreadyInvited: string[] = [];
    const isSelf: string[] = [];

    for (const email of emails) {
      if (email === request.auth.user?.email?.toLowerCase()) {
        isSelf.push(email);
        continue;
      }
      const user = await getUserByEmail(email);
      if (!user) {
        notFound.push(email);
        continue;
      }
      const inGame = await userIsInGame(gameId, user.id);
      if (inGame) {
        alreadyInGame.push(email);
        continue;
      }
      const pending = await hasPendingInvite(gameId, user.id);
      if (pending) {
        alreadyInvited.push(email);
        continue;
      }
      invitedUserIds.push(user.id);
      invitedEmails.push(email);
    }

    if (invitedUserIds.length > 0) {
      await createGameInvites(gameId, userId, invitedUserIds);
    }

    return NextResponse.json(
      {
        invitedEmails,
        notFound,
        alreadyInGame,
        alreadyInvited,
        isSelf,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/invites",
      message: "Error creating invites",
      error,
    });
    return errorResponse("Error creating invites", 500, serializeError(error));
  }
});

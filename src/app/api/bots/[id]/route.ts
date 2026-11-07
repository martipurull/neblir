import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import {
  BOT_EFFECTIVE_MAX_BELOW_ZERO_MESSAGE,
  effectiveBotMaxHp,
} from "@/app/lib/botHoldingView";
import { getBot, getBots, updateBot } from "@/app/lib/prisma/bot";
import {
  listBotCharacterRowsByBot,
  updateBotCharacter,
} from "@/app/lib/prisma/botCharacter";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { botUpdateSchema } from "@/app/lib/types/bot";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { serializeError } from "../../shared/errors";
import {
  responseIfOfficialNameTaken,
  responseIfOfficialNameUniqueConstraint,
} from "../../shared/officialNameConflict";
import { errorResponse } from "../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/bots/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      return errorResponse("Invalid bot ID", 400);
    }

    const bot = await getBot(id);
    if (!bot) {
      return errorResponse("Official bot not found", 404);
    }
    if (
      bot.accessType === "GAME_MASTER" &&
      !(await userIsSuperAdmin(request.auth.user.id))
    ) {
      return errorResponse("Official bot not found", 404);
    }
    return NextResponse.json(bot, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/bots/[id]",
      message: "Error fetching bot",
      error,
    });
    return errorResponse("Error fetching bot", 500, serializeError(error));
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/bots/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      return errorResponse("Invalid bot ID", 400);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = botUpdateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/bots/[id]",
        message: "Error parsing bot update request",
        details: error,
      });
      return errorResponse(
        "Error parsing bot update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const existing = await getBot(id);
    if (!existing) {
      return errorResponse("Official bot not found", 404);
    }

    const conflict = responseIfOfficialNameTaken(
      await getBots(),
      parsedBody.name,
      id
    );
    if (conflict) return conflict;

    const holdings =
      parsedBody.maxHp === undefined ? [] : await listBotCharacterRowsByBot(id);
    if (parsedBody.maxHp !== undefined) {
      const nextMaxHp = parsedBody.maxHp;
      const effectiveMaxWouldBeNegative = holdings.some(
        (row) => effectiveBotMaxHp(nextMaxHp, row.maxHpBonus) < 0
      );
      if (effectiveMaxWouldBeNegative) {
        return errorResponse(BOT_EFFECTIVE_MAX_BELOW_ZERO_MESSAGE, 400);
      }
    }

    const updated = await updateBot(id, parsedBody, {
      officialCatalogueWrite: true,
    });

    if (parsedBody.maxHp !== undefined) {
      const nextMaxHp = parsedBody.maxHp;
      await Promise.all(
        holdings.map(async (row) => {
          const max = effectiveBotMaxHp(nextMaxHp, row.maxHpBonus);
          if (row.currentHp <= max) return;
          await updateBotCharacter(row.id, { currentHp: max });
        })
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    const uniqueConflict = responseIfOfficialNameUniqueConstraint(error);
    if (uniqueConflict) return uniqueConflict;
    if (error instanceof ZodError) {
      return errorResponse(
        "Validation error updating bot",
        400,
        error.issues
          .map((issue) => `${issue.code} at ${issue.path}: ${issue.message}.`)
          .join("\n")
      );
    }
    logger.error({
      method: "PATCH",
      route: "/api/bots/[id]",
      message: "Error updating bot",
      error,
    });
    return errorResponse("Error updating bot", 500, serializeError(error));
  }
});

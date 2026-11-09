import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { createBot, getBots } from "@/app/lib/prisma/bot";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { botSchema } from "@/app/lib/types/bot";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../shared/errors";
import {
  responseIfOfficialNameTaken,
  responseIfOfficialNameUniqueConstraint,
} from "../shared/officialNameConflict";
import { errorResponse } from "../shared/responses";

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/bots",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = botSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/bots",
        message: "Error parsing bot creation request",
        details: error,
      });
      return errorResponse(
        "Error parsing bot creation request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const conflict = responseIfOfficialNameTaken(
      await getBots(),
      parsedBody.name
    );
    if (conflict) return conflict;

    const bot = await createBot(parsedBody, { officialCatalogueWrite: true });
    return NextResponse.json(bot, { status: 201 });
  } catch (error) {
    const uniqueConflict = responseIfOfficialNameUniqueConstraint(error);
    if (uniqueConflict) return uniqueConflict;
    const details = serializeError(error);
    logger.error({
      method: "POST",
      route: "/api/bots",
      message: "Error creating bot",
      error,
      details,
    });
    return errorResponse("Error creating bot", 500, details);
  }
});

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/bots",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const bots = await getBots();
    if (await userIsSuperAdmin(request.auth.user.id)) {
      return NextResponse.json(bots);
    }
    return NextResponse.json(bots.filter((bot) => bot.accessType === "PLAYER"));
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/bots",
      message: "Error fetching bots",
      error,
    });
    return errorResponse("Error fetching bots", 500, serializeError(error));
  }
});

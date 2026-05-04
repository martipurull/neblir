import { createEnemy, getEnemies } from "@/app/lib/prisma/enemy";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { enemyCreateSchema } from "@/app/lib/types/enemy";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      enemyCreateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing enemy creation request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const enemy = await createEnemy(parsedBody);
    return NextResponse.json(enemy, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/enemies",
      message: "Error creating enemy",
      error,
    });
    return errorResponse("Error creating enemy", 500, serializeError(error));
  }
});

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const enemies = await getEnemies();
    return NextResponse.json(enemies);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/enemies",
      message: "Error fetching enemies",
      error,
    });
    return errorResponse("Error fetching enemies", 500, serializeError(error));
  }
});

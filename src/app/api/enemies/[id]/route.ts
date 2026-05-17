import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { getEnemy } from "@/app/lib/prisma/enemy";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/enemies/[id]";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = (await params) as { id: string };
    if (!id?.trim()) {
      return errorResponse("Invalid enemy ID", 400);
    }

    const enemy = await getEnemy(id.trim());
    if (!enemy) {
      return errorResponse("Enemy not found", 404);
    }
    return NextResponse.json(enemy, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error fetching enemy",
      error,
    });
    return errorResponse("Error fetching enemy", 500, serializeError(error));
  }
});

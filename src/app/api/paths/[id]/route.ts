import { getPath } from "@/app/lib/prisma/path";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/paths/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route: "/api/paths/[id]",
        message: "Invalid path ID",
        pathId: id,
      });
      return errorResponse("Invalid path ID", 400);
    }

    const path = await getPath(id);

    return NextResponse.json(path, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/paths/[id]",
      message: "Error fetching path",
      error,
    });
    return errorResponse("Error fetching path", 500, serializeError(error));
  }
});

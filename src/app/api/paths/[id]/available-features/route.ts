import { getPath } from "@/app/lib/prisma/path";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";
import { getAllFeaturesAvailableForPath } from "@/app/lib/prisma/feature";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/paths/[id]/available-features",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route: "/api/paths/[id]/available-features",
        message: "Invalid path ID",
        pathId: id,
      });
      return errorResponse("Invalid path ID", 400);
    }

    const path = await getPath(id);
    if (!path) {
      logger.error({
        method: "GET",
        route: "/api/paths/[id]/available-features",
        message: "Path not found",
        pathId: id,
      });
      return errorResponse("Path not found", 404);
    }

    const availableFeatures = await getAllFeaturesAvailableForPath(path.name);

    return NextResponse.json(availableFeatures, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/paths/[id]/available-features",
      message: "Error fetching available features",
      error,
    });
    return errorResponse("Error fetching path", 500, serializeError(error));
  }
});

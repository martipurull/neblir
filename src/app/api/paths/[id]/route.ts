import { deletePath, getPath, updatePath } from "@/app/lib/prisma/path";
import { AuthNextRequest } from "@/app/lib/types/api";
import { pathUpdateSchema } from "@/app/lib/types/path";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
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
    return errorResponse("Error fetching path", 500, JSON.stringify(error));
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/paths/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/paths/[id]",
        message: "Invalid path ID",
        pathId: id,
      });
      return errorResponse("Invalid path ID", 400);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = pathUpdateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/paths/[id]",
        message: "Error parsing path update request",
        details: error,
      });
      return errorResponse(
        "Error parsing path update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const updatedItem = await updatePath(id, parsedBody);

    return NextResponse.json(updatedItem);
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/paths/[id]",
      message: "Error updating path",
      error,
    });
    return errorResponse("Error updating path", 500, JSON.stringify(error));
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/paths/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "DELETE",
        route: "/api/paths/[id]",
        message: "Invalid path ID",
        pathId: id,
      });
      return errorResponse("Invalid path ID", 400);
    }

    await deletePath(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/paths/[id]",
      message: "Error deleting path",
      error,
    });
    return errorResponse("Error deleting path", 500, JSON.stringify(error));
  }
});

import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { getPath, updatePath } from "@/app/lib/prisma/path";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { pathCatalogueUpdateSchema } from "@/app/lib/types/path";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/paths/[id]";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route,
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route,
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
      route,
      message: "Error fetching path",
      error,
    });
    return errorResponse("Error fetching path", 500, serializeError(error));
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = (await params) as { id: string };
    if (!id?.trim()) {
      return errorResponse("Invalid path ID", 400);
    }

    const existing = await getPath(id.trim());
    if (!existing) {
      return errorResponse("Path not found", 404);
    }

    const body = await request.json();
    const parsed = pathCatalogueUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Error parsing path update request",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return errorResponse("No fields to update", 400);
    }

    const updated = await updatePath(id.trim(), {
      ...parsed.data,
      protectedFromOfficialImport: true,
    });
    await touchStaffCatalogueDrift(["paths"]);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route,
      message: "Error updating path",
      error,
    });
    return errorResponse("Error updating path", 500, serializeError(error));
  }
});

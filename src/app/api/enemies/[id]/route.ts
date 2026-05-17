import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { getEnemy, updateEnemy } from "@/app/lib/prisma/enemy";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { enemyCatalogueUpdateSchema } from "@/app/lib/types/enemy";
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
      return errorResponse("Invalid enemy ID", 400);
    }

    const existing = await getEnemy(id.trim());
    if (!existing) {
      return errorResponse("Enemy not found", 404);
    }

    const body = await request.json();
    const parsed = enemyCatalogueUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Error parsing enemy update request",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return errorResponse("No fields to update", 400);
    }

    const updated = await updateEnemy(id.trim(), parsed.data);
    await touchStaffCatalogueDrift(["enemies"]);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route,
      message: "Error updating enemy",
      error,
    });
    return errorResponse("Error updating enemy", 500, serializeError(error));
  }
});

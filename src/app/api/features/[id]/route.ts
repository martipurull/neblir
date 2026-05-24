import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import {
  deleteFeatureCatalogue,
  getFeature,
  updateFeatureCatalogue,
} from "@/app/lib/prisma/feature";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { featureCatalogueUpdateSchema } from "@/app/lib/types/featureCatalogue";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/features/[id]";

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
      return errorResponse("Invalid feature ID", 400);
    }

    const feature = await getFeature(id.trim());
    if (!feature) {
      return errorResponse("Feature not found", 404);
    }
    return NextResponse.json(feature, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error fetching feature",
      error,
    });
    return errorResponse("Error fetching feature", 500, serializeError(error));
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
      return errorResponse("Invalid feature ID", 400);
    }

    const body = await request.json();
    const parsed = featureCatalogueUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Error parsing feature update request",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return errorResponse("No fields to update", 400);
    }

    try {
      const updated = await updateFeatureCatalogue(id.trim(), parsed.data, {
        officialCatalogueWrite: true,
      });
      if (!updated) {
        return errorResponse("Feature not found", 404);
      }
      await touchStaffCatalogueDrift(["features"]);
      return NextResponse.json(updated, { status: 200 });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (
        message.includes("already exists") ||
        message.includes("No Path rows")
      ) {
        return errorResponse(message, 400);
      }
      throw e;
    }
  } catch (error) {
    logger.error({
      method: "PATCH",
      route,
      message: "Error updating feature",
      error,
    });
    return errorResponse("Error updating feature", 500, serializeError(error));
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = (await params) as { id: string };
    if (!id?.trim()) {
      return errorResponse("Invalid feature ID", 400);
    }

    const existing = await getFeature(id.trim());
    if (!existing) {
      return errorResponse("Feature not found", 404);
    }

    await deleteFeatureCatalogue(id.trim());
    await touchStaffCatalogueDrift(["features"]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route,
      message: "Error deleting feature",
      error,
    });
    return errorResponse("Error deleting feature", 500, serializeError(error));
  }
});

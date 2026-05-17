import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import {
  createFeatureCatalogue,
  getAllFeatures,
} from "@/app/lib/prisma/feature";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { featureCatalogueCreateSchema } from "@/app/lib/types/featureCatalogue";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

const route = "/api/features";

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const features = await getAllFeatures();
    features.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(features, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error fetching features",
      error,
    });
    return errorResponse("Error fetching features", 500, serializeError(error));
  }
});

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(request.auth.user.id))) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = featureCatalogueCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Error parsing feature creation request",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    try {
      const feature = await createFeatureCatalogue(parsed.data, {
        officialCatalogueWrite: true,
      });
      await touchStaffCatalogueDrift(["features"]);
      return NextResponse.json(feature, { status: 201 });
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
      method: "POST",
      route,
      message: "Error creating feature",
      error,
    });
    return errorResponse("Error creating feature", 500, serializeError(error));
  }
});

import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { isOfficialCatalogueUsageDomain } from "@/app/lib/officialCatalogueUsage";
import { getOfficialCatalogueUsage } from "@/app/lib/prisma/officialCatalogueUsage";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/staff/catalogue-usage";

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    const userId = request.auth?.user?.id;
    if (!userId) {
      return errorResponse("Unauthorised", 401);
    }
    if (!(await userIsSuperAdmin(userId))) {
      return errorResponse("Forbidden", 403);
    }

    const url = new URL(request.url);
    const domain = url.searchParams.get("domain")?.trim() ?? "";
    const id = url.searchParams.get("id")?.trim() ?? "";
    if (!isOfficialCatalogueUsageDomain(domain)) {
      return errorResponse("Invalid catalogue domain", 400);
    }
    if (!id) {
      return errorResponse("Invalid catalogue id", 400);
    }

    const usage = await getOfficialCatalogueUsage(domain, id);
    if (!usage) {
      return errorResponse("Official catalogue row not found", 404);
    }
    return NextResponse.json(usage, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error fetching Official catalogue usage",
      error,
    });
    return errorResponse(
      "Error fetching Official catalogue usage",
      500,
      serializeError(error)
    );
  }
});

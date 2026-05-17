import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { buildCatalogueSeedDataExport } from "@/app/lib/catalogueSeedExport";
import {
  resolveCatalogueExportDomains,
  type CatalogueExportScope,
} from "@/app/lib/catalogueExportResolve";
import { getStaffCatalogueDriftState } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/staff/catalogue-seed-export";

function parseScope(raw: string | null): CatalogueExportScope | undefined {
  if (raw === null || raw === "") return "touched";
  if (raw === "all" || raw === "touched") return raw;
  return undefined;
}

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
    const scope = parseScope(url.searchParams.get("scope"));
    if (scope === undefined) {
      return errorResponse(
        'Invalid scope. Use "touched" (default) or "all".',
        400
      );
    }

    const drift = await getStaffCatalogueDriftState();
    const { domains, error } = resolveCatalogueExportDomains({
      scope,
      domainsParam: url.searchParams.get("domains"),
      touchedDomains: drift.touchedDomains,
    });
    if (error) {
      return errorResponse(error, 400);
    }

    const data = await buildCatalogueSeedDataExport(domains);

    return NextResponse.json(
      {
        exportedAt: new Date().toISOString(),
        scope,
        domains,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error exporting catalogue seed JSON",
      error,
    });
    return errorResponse(
      "Error exporting catalogue seed JSON",
      500,
      serializeError(error)
    );
  }
});

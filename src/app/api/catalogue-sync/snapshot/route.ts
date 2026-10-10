import { CATALOGUE_EXPORT_DOMAIN_ORDER } from "@/app/lib/catalogueExportResolve";
import { buildCatalogueSeedDataExport } from "@/app/lib/catalogueSeedExport";
import {
  authorizationBearerToken,
  catalogueSyncPullSecretFromEnv,
  catalogueSyncPullSecretsMatch,
} from "@/app/lib/catalogueSyncPullSecret";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/catalogue-sync/snapshot";

export async function GET(request: Request) {
  try {
    const expected = catalogueSyncPullSecretFromEnv();
    const provided = authorizationBearerToken(
      request.headers.get("authorization")
    );
    if (
      !expected ||
      !provided ||
      !catalogueSyncPullSecretsMatch(provided, expected)
    ) {
      return errorResponse("Unauthorised", 401);
    }

    const domains = [...CATALOGUE_EXPORT_DOMAIN_ORDER];
    const data = await buildCatalogueSeedDataExport(domains);
    return NextResponse.json(
      {
        exportedAt: new Date().toISOString(),
        scope: "all",
        domains,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error exporting Catalogue sync snapshot",
      error,
    });
    return errorResponse(
      "Error exporting Catalogue sync snapshot",
      500,
      serializeError(error)
    );
  }
}

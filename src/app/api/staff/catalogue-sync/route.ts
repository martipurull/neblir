import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { CATALOGUE_EXPORT_DOMAIN_ORDER } from "@/app/lib/catalogueExportResolve";
import { buildCatalogueSeedDataExport } from "@/app/lib/catalogueSeedExport";
import { diffCatalogueSyncSnapshots } from "@/app/lib/catalogueSyncDiff";
import {
  catalogueEnvironmentBaseUrl,
  catalogueSyncDestHubUrl,
  getThisCatalogueEnvironment,
  isPullableCatalogueSource,
  parseCatalogueEnvironmentParam,
} from "@/app/lib/catalogueSyncEnv";
import {
  CatalogueSyncPullError,
  pullCatalogueSyncSnapshot,
  type CatalogueSyncSnapshotData,
} from "@/app/lib/catalogueSyncPull";
import { catalogueSyncPullSecretFromEnv } from "@/app/lib/catalogueSyncPullSecret";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/staff/catalogue-sync";

function asSnapshotData(
  data: Record<string, unknown>
): CatalogueSyncSnapshotData {
  const out = {} as CatalogueSyncSnapshotData;
  for (const domain of CATALOGUE_EXPORT_DOMAIN_ORDER) {
    const rows = data[domain];
    out[domain] = Array.isArray(rows) ? rows : [];
  }
  return out;
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

    const thisEnvironment = getThisCatalogueEnvironment();
    if (!thisEnvironment) {
      return errorResponse(
        "This process is not configured as a Catalogue environment.",
        500
      );
    }

    const url = new URL(request.url);
    const source = parseCatalogueEnvironmentParam(
      url.searchParams.get("source")
    );
    const dest = parseCatalogueEnvironmentParam(url.searchParams.get("dest"));
    if (!source || !dest) {
      return errorResponse(
        "Source and destination Catalogue environments are required.",
        400
      );
    }
    if (!isPullableCatalogueSource(source)) {
      return errorResponse(
        "Local is not a pullable Catalogue sync source.",
        400
      );
    }
    if (source === dest) {
      return errorResponse(
        "Source and destination Catalogue environments must differ.",
        400
      );
    }

    if (dest !== thisEnvironment) {
      return NextResponse.json(
        {
          thisEnvironment,
          source,
          dest,
          destIsThisEnvironment: false,
          applyEnabled: false,
          destHubUrl: catalogueSyncDestHubUrl({ dest, source }) ?? null,
        },
        { status: 200 }
      );
    }

    const sourceBaseUrl = catalogueEnvironmentBaseUrl(source);
    if (!sourceBaseUrl) {
      return errorResponse(
        "Source pull URL is not configured for that Catalogue environment.",
        400
      );
    }

    const pullSecret = catalogueSyncPullSecretFromEnv();
    if (!pullSecret) {
      return errorResponse(
        "Catalogue sync pull secret is not configured.",
        500
      );
    }

    let sourceSnapshot;
    try {
      sourceSnapshot = await pullCatalogueSyncSnapshot({
        sourceBaseUrl,
        pullSecret,
      });
    } catch (error) {
      if (error instanceof CatalogueSyncPullError) {
        return errorResponse(error.message, error.status);
      }
      throw error;
    }

    const destExport = await buildCatalogueSeedDataExport([
      ...CATALOGUE_EXPORT_DOMAIN_ORDER,
    ]);
    const diff = diffCatalogueSyncSnapshots({
      source: sourceSnapshot.data,
      dest: asSnapshotData(destExport),
    });

    return NextResponse.json(
      {
        thisEnvironment,
        source,
        dest,
        destIsThisEnvironment: true,
        applyEnabled: false,
        destHubUrl: null,
        totals: diff.totals,
        domains: diff.domains,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error previewing Catalogue sync",
      error,
    });
    return errorResponse(
      "Error previewing Catalogue sync",
      500,
      serializeError(error)
    );
  }
});

import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { CATALOGUE_EXPORT_DOMAIN_ORDER } from "@/app/lib/catalogueExportResolve";
import { buildCatalogueSeedDataExport } from "@/app/lib/catalogueSeedExport";
import { applyCatalogueSyncOverlay } from "@/app/lib/catalogueSyncApply";
import { diffCatalogueSyncSnapshots } from "@/app/lib/catalogueSyncDiff";
import {
  catalogueEnvironmentBaseUrl,
  catalogueSyncDestHubUrl,
  getThisCatalogueEnvironment,
  isPullableCatalogueSource,
  parseCatalogueEnvironmentParam,
  type CatalogueEnvironment,
} from "@/app/lib/catalogueSyncEnv";
import {
  CatalogueSyncPullError,
  pullCatalogueSyncSnapshot,
  type CatalogueSyncSnapshotData,
} from "@/app/lib/catalogueSyncPull";
import { catalogueSyncPullSecretFromEnv } from "@/app/lib/catalogueSyncPullSecret";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/staff/catalogue-sync";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

type ResolvedPairing = {
  thisEnvironment: CatalogueEnvironment;
  source: CatalogueEnvironment;
  dest: CatalogueEnvironment;
};

async function authorizeCatalogueSync(
  request: AuthNextRequest
): Promise<NextResponse | null> {
  const userId = request.auth?.user?.id;
  if (!userId) {
    return errorResponse("Unauthorised", 401);
  }
  if (!(await userIsSuperAdmin(userId))) {
    return errorResponse("Forbidden", 403);
  }
  return null;
}

function resolveCatalogueSyncPairing(
  sourceRaw: string | null,
  destRaw: string | null
): ResolvedPairing | NextResponse {
  const thisEnvironment = getThisCatalogueEnvironment();
  if (!thisEnvironment) {
    return errorResponse(
      "This process is not configured as a Catalogue environment.",
      500
    );
  }

  const source = parseCatalogueEnvironmentParam(sourceRaw);
  const dest = parseCatalogueEnvironmentParam(destRaw);
  if (!source || !dest) {
    return errorResponse(
      "Source and destination Catalogue environments are required.",
      400
    );
  }
  if (!isPullableCatalogueSource(source)) {
    return errorResponse("Local is not a pullable Catalogue sync source.", 400);
  }
  if (source === dest) {
    return errorResponse(
      "Source and destination Catalogue environments must differ.",
      400
    );
  }

  return { thisEnvironment, source, dest };
}

function isPairing(
  value: ResolvedPairing | NextResponse
): value is ResolvedPairing {
  return !(value instanceof NextResponse);
}

async function loadCatalogueSyncSnapshots(
  source: CatalogueEnvironment
): Promise<
  | {
      sourceData: CatalogueSyncSnapshotData;
      destData: CatalogueSyncSnapshotData;
    }
  | NextResponse
> {
  const sourceBaseUrl = catalogueEnvironmentBaseUrl(source);
  if (!sourceBaseUrl) {
    return errorResponse(
      "Source pull URL is not configured for that Catalogue environment.",
      400
    );
  }

  const pullSecret = catalogueSyncPullSecretFromEnv();
  if (!pullSecret) {
    return errorResponse("Catalogue sync pull secret is not configured.", 500);
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
  return {
    sourceData: sourceSnapshot.data,
    destData: asSnapshotData(destExport),
  };
}

function isSnapshotPair(
  value:
    | {
        sourceData: CatalogueSyncSnapshotData;
        destData: CatalogueSyncSnapshotData;
      }
    | NextResponse
): value is {
  sourceData: CatalogueSyncSnapshotData;
  destData: CatalogueSyncSnapshotData;
} {
  return !(value instanceof NextResponse);
}

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    const denied = await authorizeCatalogueSync(request);
    if (denied) return denied;

    const url = new URL(request.url);
    const pairing = resolveCatalogueSyncPairing(
      url.searchParams.get("source"),
      url.searchParams.get("dest")
    );
    if (!isPairing(pairing)) return pairing;

    const { thisEnvironment, source, dest } = pairing;
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

    const snapshots = await loadCatalogueSyncSnapshots(source);
    if (!isSnapshotPair(snapshots)) return snapshots;

    const diff = diffCatalogueSyncSnapshots({
      source: snapshots.sourceData,
      dest: snapshots.destData,
    });

    return NextResponse.json(
      {
        thisEnvironment,
        source,
        dest,
        destIsThisEnvironment: true,
        applyEnabled: diff.totals.added + diff.totals.updated > 0,
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

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    const denied = await authorizeCatalogueSync(request);
    if (denied) return denied;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Catalogue sync apply body must be JSON.", 400);
    }
    if (!isRecord(body)) {
      return errorResponse("Catalogue sync apply body must be JSON.", 400);
    }

    const pairing = resolveCatalogueSyncPairing(
      typeof body.source === "string" ? body.source : null,
      typeof body.dest === "string" ? body.dest : null
    );
    if (!isPairing(pairing)) return pairing;

    const { thisEnvironment, source, dest } = pairing;
    if (dest !== thisEnvironment) {
      return errorResponse(
        "Apply runs only when this process is the destination Catalogue environment.",
        400
      );
    }

    const snapshots = await loadCatalogueSyncSnapshots(source);
    if (!isSnapshotPair(snapshots)) return snapshots;

    const outcome = await applyCatalogueSyncOverlay({
      source: snapshots.sourceData,
      dest: snapshots.destData,
    });
    if (outcome.status === "empty") {
      return errorResponse("Nothing to add or update.", 400);
    }

    if (outcome.changedDomains.length > 0) {
      await touchStaffCatalogueDrift(outcome.changedDomains);
    }

    return NextResponse.json(
      {
        applied: outcome.applied,
        skipped: outcome.skipped,
        failed: outcome.failed,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "POST",
      route,
      message: "Error applying Catalogue sync",
      error,
    });
    return errorResponse(
      "Error applying Catalogue sync",
      500,
      serializeError(error)
    );
  }
});

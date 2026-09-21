import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { buildCatalogueSeedDataExport } from "@/app/lib/catalogueSeedExport";
import {
  CATALOGUE_SEED_FILENAMES,
  CATALOGUE_SEED_ZIP_FILENAME,
  resolveCatalogueExportDomains,
  type CatalogueExportDomain,
  type CatalogueExportScope,
} from "@/app/lib/catalogueExportResolve";
import { getStaffCatalogueDriftState } from "@/app/lib/prisma/staffCatalogueDrift";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { strToU8, zipSync } from "fflate";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/staff/catalogue-seed-export";

type CatalogueExportFormat = "envelope" | "array" | "zip";

function parseScope(raw: string | null): CatalogueExportScope | undefined {
  if (raw === null || raw === "") return "touched";
  if (raw === "all" || raw === "touched") return raw;
  return undefined;
}

function parseFormat(raw: string | null): CatalogueExportFormat | undefined {
  if (raw === null || raw === "") return "envelope";
  if (raw === "envelope" || raw === "array" || raw === "zip") return raw;
  return undefined;
}

function catalogueSeedZipBytes(
  data: Record<string, unknown>,
  domains: CatalogueExportDomain[]
): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  for (const domain of domains) {
    const filename = CATALOGUE_SEED_FILENAMES[domain];
    files[filename] = strToU8(JSON.stringify(data[domain] ?? [], null, 2));
  }
  return zipSync(files);
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

    const format = parseFormat(url.searchParams.get("format"));
    if (format === undefined) {
      return errorResponse(
        'Invalid format. Use "envelope" (default), "array", or "zip".',
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

    if (format === "array" && domains.length !== 1) {
      return errorResponse(
        'Format "array" requires exactly one catalogue domain. Pass a single domains value.',
        400
      );
    }

    const data = await buildCatalogueSeedDataExport(domains);

    if (format === "array") {
      const domain = domains[0];
      const rows = data[domain] ?? [];
      const filename = CATALOGUE_SEED_FILENAMES[domain];
      return new NextResponse(JSON.stringify(rows, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "zip") {
      const zipped = catalogueSeedZipBytes(data, domains);
      return new NextResponse(Buffer.from(zipped), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${CATALOGUE_SEED_ZIP_FILENAME}"`,
        },
      });
    }

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
